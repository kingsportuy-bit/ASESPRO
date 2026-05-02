import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

type RouteContext = {
  params: {
    id: string;
  };
};

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
};

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function fallbackCoordinatesForLocation(locationText: string): Coordinates {
  const normalized = locationText.toLowerCase();
  if (normalized.includes("centenario")) return { latitude: -32.1333, longitude: -56.4667 };
  if (normalized.includes("paso de los toros")) return { latitude: -32.8167, longitude: -56.5167 };
  return { latitude: null, longitude: null };
}

async function geocodeLocation(locationText: string): Promise<Coordinates> {
  const fallback = fallbackCoordinatesForLocation(locationText);
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", locationText);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "uy");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ASESPRO/1.0 contacto@asespro.uy" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!response.ok) return fallback;

    const results = (await response.json()) as NominatimResult[];
    const streetNeedle = normalizeSearchText(locationText.split(",")[0]?.replace(/\d+/g, " ").replace(/\s+/g, " ").trim() ?? "");
    const first =
      results.find((result) => normalizeSearchText(`${result.name ?? ""} ${result.display_name ?? ""}`).includes(streetNeedle)) ??
      results[0];
    const latitude = first?.lat ? Number(first.lat) : NaN;
    const longitude = first?.lon ? Number(first.lon) : NaN;
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
  } catch {
    return fallback;
  }

  return fallback;
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
    forSale?: boolean;
    salePrice?: string | number | null;
    saleCurrency?: string;
    forRent?: boolean;
    rentPrice?: string | number | null;
    rentCurrency?: string;
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
    const locationText = payload.locationText.trim();
    updates.location_text = locationText;
    const geocoded = await geocodeLocation(locationText);
    if (geocoded.latitude !== null) updates.latitude = geocoded.latitude;
    if (geocoded.longitude !== null) updates.longitude = geocoded.longitude;
  }

  if (payload.status === "disponible" || payload.status === "alquilado" || payload.status === "vendido") {
    updates.status = payload.status;
  }

  if (typeof payload.forSale === "boolean") updates.for_sale = payload.forSale;
  if (typeof payload.forRent === "boolean") updates.for_rent = payload.forRent;
  if (typeof payload.saleCurrency === "string" && payload.saleCurrency.trim()) updates.sale_currency = payload.saleCurrency.trim().toUpperCase();
  if (typeof payload.rentCurrency === "string" && payload.rentCurrency.trim()) updates.rent_currency = payload.rentCurrency.trim().toUpperCase();

  const bedrooms = toOptionalNumber(payload.bedrooms);
  const bathrooms = toOptionalNumber(payload.bathrooms);
  const areaM2 = toOptionalNumber(payload.areaM2);
  const salePrice = toOptionalNumber(payload.salePrice);
  const rentPrice = toOptionalNumber(payload.rentPrice);
  if (bedrooms !== undefined) updates.bedrooms = bedrooms;
  if (bathrooms !== undefined) updates.bathrooms = bathrooms;
  if (areaM2 !== undefined) updates.area_m2 = areaM2;
  if (salePrice !== undefined) updates.sale_price = salePrice;
  if (rentPrice !== undefined) updates.rent_price = rentPrice;

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No hay cambios validos." }, { status: 400 });
  }

  const { data: updatedProperty, error } = await supabase.from("asespro_properties").update(updates).eq("id", params.id).select("id").maybeSingle();

  if (error || !updatedProperty) {
    return NextResponse.json({ error: error?.message ?? "Inmueble no encontrado." }, { status: error ? 500 : 404 });
  }

  const listingUpdates: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof updates.title === "string") listingUpdates.title = updates.title;
  if (typeof updates.description === "string") listingUpdates.description = updates.description;
  if (Object.keys(listingUpdates).length > 1) {
    const { error: listingError } = await supabase.from("asespro_listings").update(listingUpdates).eq("property_id", params.id);
    if (listingError) {
      return NextResponse.json({ error: listingError.message }, { status: 500 });
    }
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
