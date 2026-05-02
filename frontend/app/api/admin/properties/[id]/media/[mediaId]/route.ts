import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

type RouteContext = {
  params: {
    id: string;
    mediaId: string;
  };
};

const BUCKET = "asespro-media";

export async function DELETE(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await requireAdminUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 500 });
  }

  const { data: media, error: readError } = await supabase
    .from("asespro_property_media")
    .select("id,storage_path")
    .eq("id", params.mediaId)
    .eq("property_id", params.id)
    .maybeSingle();

  if (readError || !media) {
    return NextResponse.json({ error: readError?.message ?? "Archivo no encontrado." }, { status: readError ? 500 : 404 });
  }

  const { error: deleteError } = await supabase.from("asespro_property_media").delete().eq("id", params.mediaId).eq("property_id", params.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (media.storage_path) {
    await supabase.storage.from(BUCKET).remove([media.storage_path]);
  }

  return NextResponse.json({ id: params.mediaId });
}
