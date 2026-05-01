import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

type RouteContext = {
  params: {
    id: string;
  };
};

const BUCKET = "asespro-media";

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

  if (!(file instanceof File) || (mediaType !== "photo" && mediaType !== "video")) {
    return NextResponse.json({ error: "Archivo o tipo de media invalido." }, { status: 400 });
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const storagePath = `${params.id}/${mediaType}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  if (mediaType === "video") {
    await supabase.from("asespro_listing_media").delete().eq("listing_id", params.id).eq("media_type", "video");
  }

  const { data: countRows } = await supabase
    .from("asespro_listing_media")
    .select("id", { count: "exact" })
    .eq("listing_id", params.id);

  const { error: mediaError } = await supabase.from("asespro_listing_media").insert({
    listing_id: params.id,
    media_type: mediaType,
    storage_path: storagePath,
    public_url: publicData.publicUrl,
    sort_order: countRows?.length ?? 0,
    is_cover: mediaType === "photo" && isCover,
  });

  if (mediaError) {
    return NextResponse.json({ error: mediaError.message }, { status: 500 });
  }

  return NextResponse.json({ publicUrl: publicData.publicUrl, storagePath });
}
