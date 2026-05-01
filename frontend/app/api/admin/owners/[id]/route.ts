import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

type RouteContext = {
  params: {
    id: string;
  };
};

type OwnerInput = {
  fullName?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

function normalizeOwnerInput(input: unknown): Required<OwnerInput> {
  const source = input && typeof input === "object" ? (input as OwnerInput) : {};
  const fullName = typeof source.fullName === "string" ? source.fullName.trim() : "";
  if (!fullName) {
    throw new Error("El nombre del propietario es obligatorio.");
  }

  return {
    fullName,
    phone: typeof source.phone === "string" ? source.phone.trim() : "",
    email: typeof source.email === "string" ? source.email.trim() : "",
    notes: typeof source.notes === "string" ? source.notes.trim() : "",
  };
}

export async function PUT(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await requireAdminUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 500 });
  }

  try {
    const input = normalizeOwnerInput(await request.json());
    const { error } = await supabase
      .from("asespro_owners")
      .update({
        full_name: input.fullName,
        phone: input.phone || null,
        email: input.email || null,
        notes: input.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: params.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Datos invalidos." }, { status: 400 });
  }
}
