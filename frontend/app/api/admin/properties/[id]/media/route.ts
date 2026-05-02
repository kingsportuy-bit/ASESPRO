import { NextResponse } from "next/server";

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
  items?: Array<{ id?: string; sortOrder?: number; isCover?: boolean }>;
};

const BUCKET = "asespro-media";

export const runtime = "nodejs";
export const maxDuration = 1800;

function shouldBypassVideoTranscode(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".mp4") || file.type === "video/mp4";
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
    const updates: Record<string, number | boolean> = { sort_order: sortOrder };
    if (mediaType === "photo") {
      updates.is_cover = item.isCover === true;
    }
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

  if (mediaType !== "photo" && mediaType !== "video") {
    return NextResponse.json({ error: "Archivo o tipo de media invalido." }, { status: 400 });
  }

  const { data: property } = await supabase.from("asespro_properties").select("id").eq("id", params.id).maybeSingle();
  if (!property) {
    return NextResponse.json({ error: "Inmueble no encontrado." }, { status: 404 });
  }

  if (intent === "signedUpload") {
    const fileName = String(formData.get("fileName") ?? "upload.mp4").toLowerCase();
    const extension = fileName.includes(".") ? fileName.split(".").pop()?.replace(/[^a-z0-9]/g, "") || "mp4" : "mp4";
    const storagePath = `properties/${params.id}/${mediaType}-${Date.now()}.${extension}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(storagePath);
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

  if (intent === "registerUploaded") {
    if (typeof existingStoragePath !== "string" || existingStoragePath.length === 0) {
      return NextResponse.json({ error: "No se recibio la ruta del archivo cargado." }, { status: 400 });
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
