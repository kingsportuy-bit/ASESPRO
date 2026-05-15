import { NextResponse } from "next/server";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { requireAdminUser } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import { transcodeVideoToWebMp4 } from "@/lib/videoTranscode";

type RouteContext = {
  params: {
    id: string;
  };
};
type ReorderPayload = {
  mediaType?: "photo" | "video";
  items?: Array<{
    id?: string;
    sortOrder?: number;
    isCover?: boolean;
    isVisible?: boolean;
    focalX?: number;
    focalY?: number;
    altText?: string;
    caption?: string;
    qualityStatus?: string;
  }>;
};

const BUCKET = "asespro-media";
const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;
const MAX_VIDEO_SIZE_LABEL = "500 MB";
const VIDEO_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;
const UPLOAD_TMP_ROOT = path.join(tmpdir(), "asespro-video-uploads");

type TusUploadSession = {
  uploadUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  offset: number;
};

export const runtime = "nodejs";
export const maxDuration = 1800;

function shouldBypassVideoTranscode(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".mp4") || file.type === "video/mp4";
}

function sanitizeUploadId(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || !/^[a-f0-9-]{32,64}$/i.test(value)) return null;
  return value;
}

function sanitizeFileName(value: FormDataEntryValue | null): string {
  const rawName = typeof value === "string" && value.trim().length > 0 ? value.trim() : "video.mp4";
  return rawName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "video.mp4";
}

function validateVideoMetadata(fileName: string, fileSize: number, contentType: string): NextResponse | null {
  if (!fileName.toLowerCase().endsWith(".mp4") || (contentType && contentType !== "video/mp4")) {
    return NextResponse.json({ error: "El video debe ser MP4 compatible para web (H.264/AAC)." }, { status: 400 });
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_VIDEO_SIZE_BYTES) {
    return NextResponse.json({ error: `El video debe pesar como maximo ${MAX_VIDEO_SIZE_LABEL}.` }, { status: 400 });
  }
  return null;
}

function getUploadDir(propertyId: string, uploadId: string): string {
  return path.join(UPLOAD_TMP_ROOT, propertyId, uploadId);
}

function getUploadSessionPath(propertyId: string, uploadId: string): string {
  return path.join(getUploadDir(propertyId, uploadId), "session.json");
}

function getSupabaseResumableEndpoint(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const trimmed = supabaseUrl.replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    if (url.hostname.endsWith(".supabase.co")) {
      url.hostname = url.hostname.replace(/\.supabase\.co$/, ".storage.supabase.co");
    }
    url.pathname = "/storage/v1/upload/resumable";
    return url.toString();
  } catch {
    return `${trimmed}/storage/v1/upload/resumable`;
  }
}

function encodeTusMetadataValue(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function buildTusMetadata(storagePath: string, contentType: string): string {
  return [
    `bucketName ${encodeTusMetadataValue(BUCKET)}`,
    `objectName ${encodeTusMetadataValue(storagePath)}`,
    `contentType ${encodeTusMetadataValue(contentType || "video/mp4")}`,
    `cacheControl ${encodeTusMetadataValue("3600")}`,
  ].join(",");
}

function normalizeTusUploadUrl(locationHeader: string, endpoint: string): string {
  const endpointUrl = new URL(endpoint);
  const uploadUrl = new URL(locationHeader, endpointUrl);

  uploadUrl.protocol = endpointUrl.protocol;
  uploadUrl.host = endpointUrl.host;
  uploadUrl.port = endpointUrl.port;
  if (uploadUrl.pathname.startsWith("/upload/resumable/")) {
    uploadUrl.pathname = `/storage/v1${uploadUrl.pathname}`;
  }

  return uploadUrl.toString();
}

function bufferToBody(bytes: Buffer): Blob {
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: "application/offset+octet-stream" });
}

function describeUnknownError(error: unknown): string {
  if (!(error instanceof Error)) return "Error desconocido.";
  const cause = error.cause instanceof Error ? ` Causa: ${error.cause.message}` : "";
  return `${error.message}${cause}`;
}

async function readUploadSession(propertyId: string, uploadId: string): Promise<TusUploadSession | null> {
  try {
    const text = await readFile(getUploadSessionPath(propertyId, uploadId), "utf8");
    return JSON.parse(text) as TusUploadSession;
  } catch {
    return null;
  }
}

async function writeUploadSession(propertyId: string, uploadId: string, session: TusUploadSession): Promise<void> {
  const uploadDir = getUploadDir(propertyId, uploadId);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(getUploadSessionPath(propertyId, uploadId), JSON.stringify(session), "utf8");
}

async function forwardChunkToSupabaseTus({
  propertyId,
  uploadId,
  fileName,
  fileSize,
  contentType,
  chunkIndex,
  chunkBytes,
}: {
  propertyId: string;
  uploadId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  chunkIndex: number;
  chunkBytes: Buffer;
}): Promise<TusUploadSession> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const endpoint = getSupabaseResumableEndpoint();
  if (!serviceRoleKey || !endpoint) {
    throw new Error("Supabase Storage no esta configurado para carga de video por partes.");
  }

  const existing = await readUploadSession(propertyId, uploadId);
  if (!existing) {
    if (chunkIndex !== 0) {
      throw new Error("La primera parte del video no llego correctamente. Intenta subirlo otra vez.");
    }

    const extension = fileName.includes(".") ? fileName.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "mp4" : "mp4";
    const storagePath = `properties/${propertyId}/video-${Date.now()}.${extension}`;
    let createResponse: Response;
    try {
      createResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "x-upsert": "true",
          "tus-resumable": "1.0.0",
          "upload-length": String(fileSize),
          "upload-metadata": buildTusMetadata(storagePath, contentType),
          "content-type": "application/offset+octet-stream",
        },
        body: bufferToBody(chunkBytes),
      });
    } catch (error) {
      throw new Error(`No se pudo conectar con Storage al iniciar el video. ${describeUnknownError(error)}`);
    }
    if (!createResponse.ok) {
      const detail = await createResponse.text();
      throw new Error(`Storage rechazo el inicio del video (${createResponse.status}). ${detail || "Sin detalle."}`);
    }

    const locationHeader = createResponse.headers.get("location") ?? createResponse.headers.get("Location");
    if (!locationHeader) {
      throw new Error("Storage no devolvio una URL para continuar la carga.");
    }

    const headerOffset = Number(createResponse.headers.get("upload-offset") ?? createResponse.headers.get("Upload-Offset"));
    const session: TusUploadSession = {
      uploadUrl: normalizeTusUploadUrl(locationHeader, endpoint),
      storagePath,
      fileName,
      fileSize,
      contentType,
      offset: Number.isFinite(headerOffset) && headerOffset > 0 ? headerOffset : chunkBytes.length,
    };
    await writeUploadSession(propertyId, uploadId, session);
    return session;
  }

  let patchResponse: Response;
  try {
    patchResponse = await fetch(existing.uploadUrl, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "tus-resumable": "1.0.0",
        "upload-offset": String(existing.offset),
        "content-type": "application/offset+octet-stream",
      },
      body: bufferToBody(chunkBytes),
    });
  } catch (error) {
    throw new Error(`No se pudo conectar con Storage al continuar el video. ${describeUnknownError(error)}`);
  }
  if (!patchResponse.ok) {
    const detail = await patchResponse.text();
    throw new Error(`Storage rechazo una parte del video (${patchResponse.status}). ${detail || "Sin detalle."}`);
  }

  const headerOffset = Number(patchResponse.headers.get("upload-offset") ?? patchResponse.headers.get("Upload-Offset"));
  const session: TusUploadSession = {
    ...existing,
    offset: Number.isFinite(headerOffset) && headerOffset > existing.offset ? headerOffset : existing.offset + chunkBytes.length,
  };
  await writeUploadSession(propertyId, uploadId, session);
  return session;
}

function parseBucketFileSizeLimit(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();
  const asNumber = Number(normalized);
  if (Number.isFinite(asNumber)) return asNumber;

  const match = normalized.match(/^(\d+(?:\.\d+)?)(B|KB|MB|GB)?$/);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2] ?? "B";
  const multiplier =
    unit === "GB" ? 1024 * 1024 * 1024 :
    unit === "MB" ? 1024 * 1024 :
    unit === "KB" ? 1024 :
    1;

  return Math.round(amount * multiplier);
}

async function ensureBucketVideoLimit(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>): Promise<string | null> {
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket(BUCKET);
  if (bucketError || !bucket) {
    return `No se pudo validar el bucket de media: ${bucketError?.message ?? "bucket no encontrado"}`;
  }

  const rawLimit =
    (bucket as { file_size_limit?: unknown }).file_size_limit ??
    (bucket as { fileSizeLimit?: unknown }).fileSizeLimit;
  const currentLimit = parseBucketFileSizeLimit(rawLimit);
  if (typeof currentLimit === "number" && currentLimit >= MAX_VIDEO_SIZE_BYTES) {
    return null;
  }

  const { error: updateError } = await supabase.storage.updateBucket(BUCKET, {
    public: Boolean((bucket as { public?: boolean }).public),
    fileSizeLimit: MAX_VIDEO_SIZE_BYTES,
  });
  if (updateError) {
    return [
      `No se pudo ajustar el limite del bucket a ${MAX_VIDEO_SIZE_LABEL}.`,
      "Revisa en Supabase Storage > Settings el limite global y del bucket.",
      `Detalle: ${updateError.message}`,
    ].join(" ");
  }

  return null;
}

export async function PATCH(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await requireAdminUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 500 });
  }

  const payload = (await request.json()) as ReorderPayload;
  const mediaType = payload.mediaType;
  const items = Array.isArray(payload.items) ? payload.items : [];
  if ((mediaType !== "photo" && mediaType !== "video") || items.length === 0) {
    return NextResponse.json({ error: "Datos de orden invalidos." }, { status: 400 });
  }

  const mediaIds = items.map((item) => item.id).filter((id): id is string => typeof id === "string" && id.length > 0);
  if (mediaIds.length !== items.length) {
    return NextResponse.json({ error: "Algunos archivos no tienen id valido." }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("asespro_property_media")
    .select("id")
    .eq("property_id", params.id)
    .eq("media_type", mediaType)
    .in("id", mediaIds);
  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if ((existing ?? []).length !== mediaIds.length) {
    return NextResponse.json({ error: "No se pudieron validar todos los archivos del inmueble." }, { status: 400 });
  }

  if (mediaType === "photo") {
    const { error: clearCoverError } = await supabase
      .from("asespro_property_media")
      .update({ is_cover: false })
      .eq("property_id", params.id)
      .eq("media_type", "photo");
    if (clearCoverError) {
      return NextResponse.json({ error: clearCoverError.message }, { status: 500 });
    }
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const sortOrder = Number.isFinite(item.sortOrder as number) ? Number(item.sortOrder) : index;
    const updates: Record<string, number | boolean | string | null> = { sort_order: sortOrder };
    if (mediaType === "photo") {
      updates.is_cover = item.isCover === true;
      if (typeof item.focalX === "number" && Number.isFinite(item.focalX)) updates.focal_x = Math.min(100, Math.max(0, item.focalX));
      if (typeof item.focalY === "number" && Number.isFinite(item.focalY)) updates.focal_y = Math.min(100, Math.max(0, item.focalY));
    }
    if (typeof item.isVisible === "boolean") updates.is_visible = item.isVisible;
    if (typeof item.altText === "string") updates.alt_text = item.altText.trim() || null;
    if (typeof item.caption === "string") updates.caption = item.caption.trim() || null;
    if (typeof item.qualityStatus === "string" && item.qualityStatus.trim()) updates.quality_status = item.qualityStatus.trim();
    const { error } = await supabase
      .from("asespro_property_media")
      .update(updates)
      .eq("id", item.id)
      .eq("property_id", params.id)
      .eq("media_type", mediaType);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await requireAdminUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 500 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");
  const file = formData.get("file");
  const mediaType = formData.get("mediaType");
  const isCover = formData.get("isCover") === "true";
  const replaceGroup = formData.get("replaceGroup") === "true";
  const existingStoragePath = formData.get("storagePath");
  const externalMediaUrl = formData.get("mediaUrl");

  if (mediaType !== "photo" && mediaType !== "video") {
    return NextResponse.json({ error: "Archivo o tipo de media invalido." }, { status: 400 });
  }

  const { data: property } = await supabase.from("asespro_properties").select("id").eq("id", params.id).maybeSingle();
  if (!property) {
    return NextResponse.json({ error: "Inmueble no encontrado." }, { status: 404 });
  }

  if (intent === "chunkedUploadInit") {
    const fileName = sanitizeFileName(formData.get("fileName"));
    const fileSize = Number(formData.get("fileSize"));
    const contentType = String(formData.get("contentType") ?? "");
    const metadataError = validateVideoMetadata(fileName, fileSize, contentType);
    if (metadataError) return metadataError;

    const uploadId = crypto.randomUUID();
    await mkdir(getUploadDir(params.id, uploadId), { recursive: true });
    return NextResponse.json({ uploadId, chunkSize: VIDEO_CHUNK_SIZE_BYTES });
  }

  if (intent === "chunkedUploadPart") {
    const uploadId = sanitizeUploadId(formData.get("uploadId"));
    const chunkIndex = Number(formData.get("chunkIndex"));
    const totalChunks = Number(formData.get("totalChunks"));
    const fileName = sanitizeFileName(formData.get("fileName"));
    const fileSize = Number(formData.get("fileSize"));
    const contentType = String(formData.get("contentType") ?? "video/mp4");
    const chunk = formData.get("chunk");
    const metadataError = validateVideoMetadata(fileName, fileSize, contentType);
    if (metadataError) return metadataError;
    if (!uploadId || !Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || chunkIndex < 0 || totalChunks <= 0 || chunkIndex >= totalChunks) {
      return NextResponse.json({ error: "Datos de parte de video invalidos." }, { status: 400 });
    }
    if (!(chunk instanceof File) || chunk.size <= 0 || chunk.size > VIDEO_CHUNK_SIZE_BYTES + 1024 * 512) {
      return NextResponse.json({ error: "La parte de video recibida no es valida." }, { status: 400 });
    }

    try {
      const bytes = Buffer.from(await chunk.arrayBuffer());
      const session = await forwardChunkToSupabaseTus({
        propertyId: params.id,
        uploadId,
        fileName,
        fileSize,
        contentType,
        chunkIndex,
        chunkBytes: bytes,
      });
      return NextResponse.json({ ok: true, chunkIndex, offset: session.offset, uploadUrl: session.uploadUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo subir una parte del video.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (intent === "chunkedUploadComplete") {
    const uploadId = sanitizeUploadId(formData.get("uploadId"));
    const fileName = sanitizeFileName(formData.get("fileName"));
    const fileSize = Number(formData.get("fileSize"));
    const contentType = String(formData.get("contentType") ?? "video/mp4");
    const totalChunks = Number(formData.get("totalChunks"));
    const metadataError = validateVideoMetadata(fileName, fileSize, contentType);
    if (metadataError) return metadataError;
    if (!uploadId || !Number.isInteger(totalChunks) || totalChunks <= 0) {
      return NextResponse.json({ error: "Datos de cierre de video invalidos." }, { status: 400 });
    }

    const uploadDir = getUploadDir(params.id, uploadId);
    try {
      const session = await readUploadSession(params.id, uploadId);
      if (!session) {
    return NextResponse.json({ error: "No se encontró la sesión de carga del video. Intenta subirlo otra vez." }, { status: 400 });
      }
      if (session.fileSize !== fileSize || session.fileName !== fileName) {
    return NextResponse.json({ error: "Los datos del video no coinciden con la sesión de carga." }, { status: 400 });
      }
      if (session.offset !== fileSize) {
        return NextResponse.json({ error: "El video no termino de subir completo. Intenta subirlo otra vez." }, { status: 400 });
      }

      const { error: deleteError } = await supabase.from("asespro_property_media").delete().eq("property_id", params.id).eq("media_type", "video");
      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(session.storagePath);
      const { count } = await supabase
        .from("asespro_property_media")
        .select("id", { count: "exact", head: true })
        .eq("property_id", params.id);

      const { data: media, error: mediaError } = await supabase
        .from("asespro_property_media")
        .insert({
          property_id: params.id,
          media_type: "video",
          storage_path: session.storagePath,
          public_url: publicData.publicUrl,
          sort_order: count ?? 0,
          is_cover: false,
        })
        .select("id,media_type,public_url,storage_path,sort_order,is_cover")
        .maybeSingle();

      if (mediaError || !media) {
        return NextResponse.json({ error: mediaError?.message ?? "El video subio, pero no quedo registrado en la base." }, { status: 500 });
      }
      return NextResponse.json({ media });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fallo inesperado al finalizar la carga del video.";
      console.error("[admin][chunkedUploadComplete] error", { propertyId: params.id, uploadId, message });
      return NextResponse.json({ error: `No se pudo finalizar la carga del video: ${message}` }, { status: 500 });
    } finally {
      await rm(uploadDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  if (intent === "signedUpload") {
    const fileName = String(formData.get("fileName") ?? "upload.mp4").toLowerCase();
    const fileSize = Number(formData.get("fileSize"));
    const contentType = String(formData.get("contentType") ?? "");
    if (mediaType === "video") {
      const ensureLimitError = await ensureBucketVideoLimit(supabase);
      if (ensureLimitError) {
        return NextResponse.json({ error: ensureLimitError }, { status: 400 });
      }
      if (!fileName.endsWith(".mp4") || (contentType && contentType !== "video/mp4")) {
        return NextResponse.json({ error: "El video debe ser MP4 compatible para web (H.264/AAC)." }, { status: 400 });
      }
      if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_VIDEO_SIZE_BYTES) {
        return NextResponse.json({ error: `El video debe pesar como maximo ${MAX_VIDEO_SIZE_LABEL}.` }, { status: 400 });
      }
    }
    const extension = fileName.includes(".") ? fileName.split(".").pop()?.replace(/[^a-z0-9]/g, "") || "mp4" : "mp4";
    const storagePath = `properties/${params.id}/${mediaType}-${Date.now()}.${extension}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(storagePath, { upsert: true });
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "No se pudo crear la URL firmada de carga." }, { status: 500 });
    }
    return NextResponse.json({ path: storagePath, token: data.token });
  }

  if (replaceGroup || mediaType === "video") {
    const { error: deleteError } = await supabase.from("asespro_property_media").delete().eq("property_id", params.id).eq("media_type", mediaType);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  if (intent === "registerExternalUrl") {
    if (typeof externalMediaUrl !== "string" || externalMediaUrl.trim().length === 0) {
      return NextResponse.json({ error: "No se recibio un link de video valido." }, { status: 400 });
    }
    const mediaUrl = externalMediaUrl.trim();
    if (!/^https?:\/\//i.test(mediaUrl)) {
      return NextResponse.json({ error: "El link de video debe comenzar con http o https." }, { status: 400 });
    }
    const { count } = await supabase
      .from("asespro_property_media")
      .select("id", { count: "exact", head: true })
      .eq("property_id", params.id);

    const { data: media, error: mediaError } = await supabase
      .from("asespro_property_media")
      .insert({
        property_id: params.id,
        media_type: mediaType,
        storage_path: null,
        public_url: mediaUrl,
        sort_order: count ?? 0,
        is_cover: mediaType === "photo" && isCover,
      })
      .select("id,media_type,public_url,storage_path,sort_order,is_cover")
      .maybeSingle();

    if (mediaError || !media) {
      return NextResponse.json({ error: mediaError?.message ?? "No se pudo registrar el link de video." }, { status: 500 });
    }
    return NextResponse.json({ media });
  }

  if (intent === "registerUploaded") {
    if (typeof existingStoragePath !== "string" || existingStoragePath.length === 0) {
      return NextResponse.json({ error: "No se recibio la ruta del archivo cargado." }, { status: 400 });
    }
    if (mediaType === "video" && !existingStoragePath.toLowerCase().endsWith(".mp4")) {
      return NextResponse.json({ error: "Solo se pueden registrar videos MP4 compatibles para web." }, { status: 400 });
    }
    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(existingStoragePath);
    const { count } = await supabase
      .from("asespro_property_media")
      .select("id", { count: "exact", head: true })
      .eq("property_id", params.id);

    const { data: media, error: mediaError } = await supabase
      .from("asespro_property_media")
      .insert({
        property_id: params.id,
        media_type: mediaType,
        storage_path: existingStoragePath,
        public_url: publicData.publicUrl,
        sort_order: count ?? 0,
        is_cover: mediaType === "photo" && isCover,
      })
      .select("id,media_type,public_url,storage_path,sort_order,is_cover")
      .maybeSingle();

    if (mediaError || !media) {
      return NextResponse.json({ error: mediaError?.message ?? "El archivo subio, pero no quedo registrado en la base." }, { status: 500 });
    }
    return NextResponse.json({ media });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo o tipo de media invalido." }, { status: 400 });
  }

  let uploadBody: File | Buffer = file;
  let contentType = file.type || undefined;
  let extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";

  if (mediaType === "video" && !shouldBypassVideoTranscode(file)) {
    try {
      const transcoded = await transcodeVideoToWebMp4(file);
      if (transcoded) {
        uploadBody = transcoded.buffer;
        contentType = transcoded.contentType;
        extension = transcoded.extension;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido al convertir video.";
      return NextResponse.json({ error: `No se pudo procesar el video para web: ${message}` }, { status: 422 });
    }
  }

  const storagePath = `properties/${params.id}/${mediaType}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, uploadBody, {
    contentType: contentType || (extension === "mp4" ? "video/mp4" : undefined),
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const { count } = await supabase
    .from("asespro_property_media")
    .select("id", { count: "exact", head: true })
    .eq("property_id", params.id);

  const { data: media, error: mediaError } = await supabase
    .from("asespro_property_media")
    .insert({
      property_id: params.id,
      media_type: mediaType,
      storage_path: storagePath,
      public_url: publicData.publicUrl,
      sort_order: count ?? 0,
      is_cover: mediaType === "photo" && isCover,
    })
    .select("id,media_type,public_url,storage_path,sort_order,is_cover")
    .maybeSingle();

  if (mediaError || !media) {
    return NextResponse.json({ error: mediaError?.message ?? "El archivo subio, pero no quedo registrado en la base." }, { status: 500 });
  }

  return NextResponse.json({ media });
}
