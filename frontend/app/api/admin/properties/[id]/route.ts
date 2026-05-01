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

  const payload = (await request.json()) as { isActive?: boolean; latitude?: number; longitude?: number };
  const updates: Record<string, boolean | number | string> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof payload.isActive === "boolean") {
    updates.is_active = payload.isActive;
  }

  if (typeof payload.latitude === "number" && Number.isFinite(payload.latitude)) {
    updates.latitude = payload.latitude;
  }

  if (typeof payload.longitude === "number" && Number.isFinite(payload.longitude)) {
    updates.longitude = payload.longitude;
  }

  if (!("is_active" in updates) && !("latitude" in updates) && !("longitude" in updates)) {
    return NextResponse.json({ error: "No hay cambios validos." }, { status: 400 });
  }

  const { error } = await supabase.from("asespro_properties").update(updates).eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: params.id });
}
