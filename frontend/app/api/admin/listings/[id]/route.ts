import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { normalizeAdminListingInput } from "@/lib/adminListings";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

type RouteContext = {
  params: {
    id: string;
  };
};

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
    const input = normalizeAdminListingInput(await request.json());
    const { data: existing, error: existingError } = await supabase
      .from("asespro_listings")
      .select("property_id")
      .eq("id", params.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: existingError?.message ?? "Publicacion no encontrada." }, { status: 404 });
    }

    const { error: propertyError } = await supabase
      .from("asespro_properties")
      .update({
        title: input.title,
        description: input.description,
        property_type: input.propertyType,
        location_text: input.locationText,
        latitude: input.latitude,
        longitude: input.longitude,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        area_m2: input.areaM2,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.property_id);

    if (propertyError) {
      return NextResponse.json({ error: propertyError.message }, { status: 500 });
    }

    const { error: listingError } = await supabase
      .from("asespro_listings")
      .update({
        title: input.title,
        description: input.description,
        price_amount: input.priceAmount,
        price_currency: input.priceCurrency,
        status: input.status,
        published_at: input.status === "activo" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (listingError) {
      return NextResponse.json({ error: listingError.message }, { status: 500 });
    }

    const { error: deleteOperationsError } = await supabase.from("asespro_listing_operations").delete().eq("listing_id", params.id);
    if (deleteOperationsError) {
      return NextResponse.json({ error: deleteOperationsError.message }, { status: 500 });
    }

    const { error: operationsError } = await supabase.from("asespro_listing_operations").insert(
      input.operations.map((operation) => ({
        listing_id: params.id,
        operation,
      })),
    );

    if (operationsError) {
      return NextResponse.json({ error: operationsError.message }, { status: 500 });
    }

    return NextResponse.json({ id: params.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Datos invalidos." }, { status: 400 });
  }
}
