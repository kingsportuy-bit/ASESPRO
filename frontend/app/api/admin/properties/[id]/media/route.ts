import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

type RouteContext = {
  params: {
    id: string;
  };
};

const BUCKET = "asespro-media";

export const runtime = "nodejs";
export const maxDuration = 120;

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
  const file = formData.get("file");
  const mediaType = formData.get("mediaType");
  const isCover = formData.get("isCover") === "true";
  const replaceGroup = formData.get("replaceGroup") === "true";

  if (!(file instanceof File) || (mediaType !== "photo" && mediaType !== "video")) {
    return NextResponse.json({ error: "Archivo o tipo de media invalido." }, { status: 400 });
  }

  const { data: property } = await supabase.from("asespro_properties").select("id").eq("id", params.id).maybeSingle();
  if (!property) {
    return NextResponse.json({ error: "Inmueble no encontrado." }, { status: 404 });
  }

  if (replaceGroup || mediaType === "video") {
    const { error: deleteError } = await supabase.from("asespro_property_media").delete().eq("property_id", params.id).eq("media_type", mediaType);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";
  const storagePath = `properties/${params.id}/${mediaType}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || (extension === "mp4" ? "video/mp4" : undefined),
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
