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

  const payload = (await request.json()) as {
    isActive?: boolean;
    latitude?: number;
    longitude?: number;
    title?: string;
    description?: string;
    propertyType?: string;
    locationText?: string;
    bedrooms?: string | number | null;
    bathrooms?: string | number | null;
    areaM2?: string | number | null;
    status?: string;
  };
  const updates: Record<string, boolean | number | string | null> = {
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

  if (typeof payload.title === "string" && payload.title.trim()) {
    updates.title = payload.title.trim();
  }

  if (typeof payload.description === "string") {
    updates.description = payload.description.trim();
  }

  if (payload.propertyType === "casa" || payload.propertyType === "apartamento" || payload.propertyType === "terreno") {
    updates.property_type = payload.propertyType;
  }

  if (typeof payload.locationText === "string" && payload.locationText.trim()) {
    updates.location_text = payload.locationText.trim();
  }

  if (payload.status === "disponible" || payload.status === "alquilado" || payload.status === "vendido") {
    updates.status = payload.status;
  }

  const bedrooms = toOptionalNumber(payload.bedrooms);
  const bathrooms = toOptionalNumber(payload.bathrooms);
  const areaM2 = toOptionalNumber(payload.areaM2);
  if (bedrooms !== undefined) updates.bedrooms = bedrooms;
  if (bathrooms !== undefined) updates.bathrooms = bathrooms;
  if (areaM2 !== undefined) updates.area_m2 = areaM2;

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No hay cambios validos." }, { status: 400 });
  }

  const { error } = await supabase.from("asespro_properties").update(updates).eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: params.id });
}

function toOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
