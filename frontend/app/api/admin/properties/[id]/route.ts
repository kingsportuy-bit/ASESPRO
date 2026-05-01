import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await requireAdminUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 500 });
  }

  const payload = (await request.json()) as { isActive?: boolean };
  if (typeof payload.isActive !== "boolean") {
    return NextResponse.json({ error: "Estado invalido." }, { status: 400 });
  }

  const { error } = await supabase
    .from("asespro_properties")
    .update({
      is_active: payload.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: params.id, isActive: payload.isActive });
}
