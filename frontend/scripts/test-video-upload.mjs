import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");
const BUCKET = "asespro-media";
const TEST_VIDEO_SIZE = 7 * 1024 * 1024 + 123;
const TEST_TITLE_PREFIX = "video-upload-test-";

function loadEnv() {
  const raw = readFileSync(ENV_PATH, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!match) continue;
    env[match[1].trim()] = match[2].trim();
  }
  return env;
}

function assertEnv(env, key) {
  if (!env[key]) throw new Error(`Falta ${key} en .env.local`);
  return env[key];
}

function createFakeMp4Bytes(size) {
  const bytes = new Uint8Array(size);
  const header = new TextEncoder().encode("\0\0\0 ftypisom\0\0\0\0isomiso2avc1mp41");
  bytes.set(header.slice(0, Math.min(header.length, size)));
  for (let index = header.length; index < size; index += 1) {
    bytes[index] = (index * 31 + 17) % 251;
  }
  return bytes;
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text };
  }
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(payload.error ?? `HTTP ${response.status}`);
  }
  return payload;
}

async function cleanupOldTestRows(admin) {
  const { data: oldProperties } = await admin
    .from("asespro_properties")
    .select("id,asespro_property_media(storage_path)")
    .like("title", `${TEST_TITLE_PREFIX}%`);
  for (const property of oldProperties ?? []) {
    const storagePaths = (property.asespro_property_media ?? [])
      .map((item) => item.storage_path)
      .filter((value) => typeof value === "string" && value.length > 0);
    if (storagePaths.length > 0) {
      await admin.storage.from(BUCKET).remove(storagePaths);
    }
    await admin.from("asespro_property_media").delete().eq("property_id", property.id);
    await admin.from("asespro_properties").delete().eq("id", property.id);
  }
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = assertEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = assertEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = assertEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
  const baseUrl = (process.env.ASESPRO_TEST_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
  const marker = `${TEST_TITLE_PREFIX}${Date.now()}-${randomUUID().slice(0, 8)}`;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const cleanup = {
    propertyId: null,
    storagePaths: [],
  };

  try {
    await cleanupOldTestRows(admin);

    const health = await fetch(`${baseUrl}/admin`);
    if (!health.ok) throw new Error(`El servidor local no responde en ${baseUrl}/admin: HTTP ${health.status}`);

    const { data: property, error: propertyError } = await admin
      .from("asespro_properties")
      .insert({
        title: marker,
        description: "Inmueble temporal para test automatizado de subida de video.",
        property_type: "casa",
        location_text: "Test 123, Paso de los Toros, Tacuarembo, Uruguay",
        latitude: -32.8167,
        longitude: -56.5167,
        bedrooms: 1,
        bathrooms: 1,
        area_m2: 30,
        for_rent: true,
        rent_price: 1,
        rent_currency: "UYU",
        for_sale: false,
        is_active: false,
        status: "disponible",
      })
      .select("id")
      .single();
    if (propertyError || !property) {
      throw new Error(`No se pudo crear inmueble temporal: ${propertyError?.message ?? "sin id"}`);
    }
    cleanup.propertyId = property.id;

    const endpoint = `${baseUrl}/api/admin/properties/${property.id}/media`;
    const testEmail = process.env.ASESPRO_TEST_EMAIL;
    const testPassword = process.env.ASESPRO_TEST_PASSWORD;
    let requestHeaders = { "x-asespro-test-key": serviceRoleKey };
    if (testEmail && testPassword) {
      const { data: session, error: signInError } = await publicClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      if (signInError || !session.session?.access_token) {
        throw new Error(`No se pudo iniciar sesion de prueba: ${signInError?.message ?? "sin token"}`);
      }
      requestHeaders = { Authorization: `Bearer ${session.session.access_token}` };
    }
    const videoName = `${marker}.mp4`;
    const videoBytes = createFakeMp4Bytes(TEST_VIDEO_SIZE);
    const initData = new FormData();
    initData.set("intent", "chunkedUploadInit");
    initData.set("mediaType", "video");
    initData.set("fileName", videoName);
    initData.set("fileSize", String(videoBytes.byteLength));
    initData.set("contentType", "video/mp4");

    const initPayload = await requestJson(endpoint, {
      method: "POST",
      headers: requestHeaders,
      body: initData,
    });
    if (!initPayload.uploadId || !initPayload.chunkSize) {
      throw new Error("El init de carga no devolvio uploadId/chunkSize.");
    }

    const chunkSize = Number(initPayload.chunkSize);
    const totalChunks = Math.ceil(videoBytes.byteLength / chunkSize);
    if (totalChunks < 2) {
      throw new Error(`El test necesita al menos 2 partes; obtuvo ${totalChunks}.`);
    }

    for (let index = 0; index < totalChunks; index += 1) {
      const start = index * chunkSize;
      const end = Math.min(videoBytes.byteLength, start + chunkSize);
      const part = videoBytes.slice(start, end);
      const partData = new FormData();
      partData.set("intent", "chunkedUploadPart");
      partData.set("mediaType", "video");
      partData.set("uploadId", initPayload.uploadId);
      partData.set("chunkIndex", String(index));
      partData.set("totalChunks", String(totalChunks));
      partData.set("fileName", videoName);
      partData.set("fileSize", String(videoBytes.byteLength));
      partData.set("contentType", "video/mp4");
      partData.set("chunk", new Blob([part], { type: "video/mp4" }), `${videoName}.part-${index}`);
      const partPayload = await requestJson(endpoint, {
        method: "POST",
        headers: requestHeaders,
        body: partData,
      });
      if (partPayload.ok !== true) throw new Error(`La parte ${index + 1} no devolvio ok=true.`);
      if (partPayload.uploadUrl && String(partPayload.uploadUrl).includes(":8000")) {
        throw new Error(`La API guardo una URL interna de Storage: ${partPayload.uploadUrl}`);
      }
    }

    const completeData = new FormData();
    completeData.set("intent", "chunkedUploadComplete");
    completeData.set("mediaType", "video");
    completeData.set("uploadId", initPayload.uploadId);
    completeData.set("fileName", videoName);
    completeData.set("fileSize", String(videoBytes.byteLength));
    completeData.set("contentType", "video/mp4");
    completeData.set("totalChunks", String(totalChunks));
    completeData.set("replaceGroup", "true");

    const completePayload = await requestJson(endpoint, {
      method: "POST",
      headers: requestHeaders,
      body: completeData,
    });
    if (completePayload.media?.media_type !== "video" || !completePayload.media.storage_path) {
      throw new Error("La carga completo, pero no devolvio media de video registrada.");
    }
    cleanup.storagePaths.push(completePayload.media.storage_path);

    const { data: mediaRow, error: mediaReadError } = await admin
      .from("asespro_property_media")
      .select("id,property_id,media_type,storage_path,public_url")
      .eq("id", completePayload.media.id)
      .single();
    if (mediaReadError || !mediaRow) {
      throw new Error(`No se encontro el registro de media: ${mediaReadError?.message ?? "sin fila"}`);
    }
    if (mediaRow.property_id !== property.id || mediaRow.media_type !== "video") {
      throw new Error("El registro de media no coincide con el inmueble temporal.");
    }

    const { data: objectInfo, error: objectError } = await admin.storage.from(BUCKET).list(path.dirname(mediaRow.storage_path), {
      search: path.basename(mediaRow.storage_path),
      limit: 1,
    });
    if (objectError || !objectInfo?.some((item) => item.name === path.basename(mediaRow.storage_path))) {
      throw new Error(`El objeto no aparece en Storage: ${objectError?.message ?? "no listado"}`);
    }

    console.log(JSON.stringify({
      ok: true,
      propertyId: property.id,
      mediaId: mediaRow.id,
      storagePath: mediaRow.storage_path,
      chunks: totalChunks,
      bytes: videoBytes.byteLength,
    }, null, 2));
  } finally {
    for (const storagePath of cleanup.storagePaths) {
      await admin.storage.from(BUCKET).remove([storagePath]);
    }
    if (cleanup.propertyId) {
      await admin.from("asespro_property_media").delete().eq("property_id", cleanup.propertyId);
      await admin.from("asespro_properties").delete().eq("id", cleanup.propertyId);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
