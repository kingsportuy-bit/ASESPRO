import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { normalizeAdminListingInput } from "@/lib/adminListings";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import type { PropertyStatus } from "@/lib/properties";

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

    if (input.syncPropertyData) {
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
          for_sale: input.forSale,
          sale_price: input.salePrice,
          sale_currency: input.saleCurrency,
          for_rent: input.forRent,
          rent_price: input.rentPrice,
          rent_currency: input.rentCurrency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.propertyId ?? existing.property_id);

      if (propertyError) {
        return NextResponse.json({ error: propertyError.message }, { status: 500 });
      }
    }

    const operation = input.operations[0];
    const priceAmount = operation === "alquiler" ? input.rentPrice : input.salePrice;
    const priceCurrency = operation === "alquiler" ? input.rentCurrency : input.saleCurrency;

    if (input.ownerId) {
      const linkedPropertyId = input.propertyId ?? existing.property_id;
      const { data: existingLink } = await supabase
        .from("asespro_property_owners")
        .select("property_id")
        .eq("property_id", linkedPropertyId)
        .eq("owner_id", input.ownerId)
        .maybeSingle();

      if (!existingLink) {
        const { error: ownerLinkError } = await supabase.from("asespro_property_owners").insert({
          property_id: linkedPropertyId,
          owner_id: input.ownerId,
        });
        if (ownerLinkError) {
          return NextResponse.json({ error: ownerLinkError.message }, { status: 500 });
        }
      }
    }

    const { error: listingError } = await supabase
      .from("asespro_listings")
      .update({
        title: input.title,
        description: input.description,
        property_id: input.propertyId ?? existing.property_id,
        price_amount: priceAmount,
        price_currency: priceCurrency,
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

export async function PATCH(request: Request, { params }: RouteContext): Promise<NextResponse> {
  const auth = await requireAdminUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 500 });
  }

  const payload = (await request.json()) as { status?: PropertyStatus; operations?: unknown };
  const status = payload.status;
  if (status !== "activo" && status !== "desactivado") {
    return NextResponse.json({ error: "Estado invalido." }, { status: 400 });
  }

  const updates: Record<string, string | null> = {
    status,
    published_at: status === "activo" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  if (Array.isArray(payload.operations)) {
    const operations = payload.operations.filter((operation): operation is "alquiler" | "venta" => operation === "alquiler" || operation === "venta");
    if (operations.length === 0) {
      return NextResponse.json({ error: "Selecciona una operacion valida." }, { status: 400 });
    }

    const { data: listing, error: listingReadError } = await supabase
      .from("asespro_listings")
      .select("property_id,asespro_properties(sale_price,sale_currency,rent_price,rent_currency)")
      .eq("id", params.id)
      .maybeSingle();

    if (listingReadError || !listing) {
      return NextResponse.json({ error: listingReadError?.message ?? "Publicacion no encontrada." }, { status: 404 });
    }

    const property = Array.isArray(listing.asespro_properties) ? listing.asespro_properties[0] : listing.asespro_properties;
    const operation = operations[0];
    updates.price_amount = operation === "alquiler" ? property?.rent_price ?? null : property?.sale_price ?? null;
    updates.price_currency = operation === "alquiler" ? property?.rent_currency ?? "UYU" : property?.sale_currency ?? "USD";

    const { error: deleteOperationsError } = await supabase.from("asespro_listing_operations").delete().eq("listing_id", params.id);
    if (deleteOperationsError) {
      return NextResponse.json({ error: deleteOperationsError.message }, { status: 500 });
    }

    const { error: operationsError } = await supabase.from("asespro_listing_operations").insert(
      operations.map((operation) => ({
        listing_id: params.id,
        operation,
      })),
    );
    if (operationsError) {
      return NextResponse.json({ error: operationsError.message }, { status: 500 });
    }
  }

  const { data: updated, error } = await supabase
    .from("asespro_listings")
    .update(updates)
    .eq("id", params.id)
    .select("id,status")
    .maybeSingle();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Publicacion no encontrada." }, { status: error ? 500 : 404 });
  }

  return NextResponse.json({ id: updated.id, status: updated.status });
}
