import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { normalizeAdminListingInput } from "@/lib/adminListings";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireAdminUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("asespro_listings")
    .select(
      "id,property_id,title,description,price_amount,price_currency,status,created_at,asespro_properties(property_type,location_text,latitude,longitude,bedrooms,bathrooms,area_m2),asespro_listing_operations(operation),asespro_listing_media(id,media_type,public_url,storage_path,sort_order,is_cover)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request): Promise<NextResponse> {
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
    let propertyId = input.propertyId;

    if (!propertyId) {
      const { data: property, error: propertyError } = await supabase
        .from("asespro_properties")
        .insert({
          title: input.title,
          description: input.description,
          property_type: input.propertyType,
          location_text: input.locationText,
          latitude: input.latitude,
          longitude: input.longitude,
          bedrooms: input.bedrooms,
          bathrooms: input.bathrooms,
          area_m2: input.areaM2,
          is_active: true,
        })
        .select("id")
        .single();

      if (propertyError || !property) {
        return NextResponse.json({ error: propertyError?.message ?? "No se pudo crear el inmueble." }, { status: 500 });
      }

      propertyId = property.id;
    } else if (input.syncPropertyData) {
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
        .eq("id", propertyId);

      if (propertyError) {
        return NextResponse.json({ error: propertyError.message }, { status: 500 });
      }
    }

    if (input.ownerId && propertyId) {
      const { data: existingLink } = await supabase
        .from("asespro_property_owners")
        .select("property_id")
        .eq("property_id", propertyId)
        .eq("owner_id", input.ownerId)
        .maybeSingle();

      if (!existingLink) {
        const { error: ownerLinkError } = await supabase.from("asespro_property_owners").insert({ property_id: propertyId, owner_id: input.ownerId });
        if (ownerLinkError) {
          return NextResponse.json({ error: ownerLinkError.message }, { status: 500 });
        }
      }
    }

    const { data: listing, error: listingError } = await supabase
      .from("asespro_listings")
      .insert({
        property_id: propertyId,
        title: input.title,
        description: input.description,
        price_amount: input.priceAmount,
        price_currency: input.priceCurrency,
        status: input.status,
        published_at: input.status === "activo" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: listingError?.message ?? "No se pudo crear la publicacion." }, { status: 500 });
    }

    const { error: operationsError } = await supabase.from("asespro_listing_operations").insert(
      input.operations.map((operation) => ({
        listing_id: listing.id,
        operation,
      })),
    );

    if (operationsError) {
      return NextResponse.json({ error: operationsError.message }, { status: 500 });
    }

    return NextResponse.json({ id: listing.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Datos invalidos." }, { status: 400 });
  }
}
