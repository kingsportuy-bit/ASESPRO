import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
import { normalizeAdminListingInput } from "@/lib/adminListings";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";

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

const LISTINGS_SELECT_WITH_FEATURED =
  "id,property_id,title,description,price_amount,price_currency,is_featured,status,created_at,asespro_properties(title,description,property_type,location_text,latitude,longitude,bedrooms,bathrooms,area_m2,for_sale,sale_price,sale_currency,for_rent,rent_price,rent_currency,asespro_property_media(id,media_type,public_url,storage_path,sort_order,is_cover)),asespro_listing_operations(operation),asespro_listing_media(id,media_type,public_url,storage_path,sort_order,is_cover)";
const LISTINGS_SELECT_FALLBACK =
  "id,property_id,title,description,price_amount,price_currency,status,created_at,asespro_properties(title,description,property_type,location_text,latitude,longitude,bedrooms,bathrooms,area_m2,for_sale,sale_price,sale_currency,for_rent,rent_price,rent_currency,asespro_property_media(id,media_type,public_url,storage_path,sort_order,is_cover)),asespro_listing_operations(operation),asespro_listing_media(id,media_type,public_url,storage_path,sort_order,is_cover)";

function isMissingFeaturedColumn(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("is_featured") && normalized.includes("column");
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getStreetNeedle(locationText: string): string {
  return normalizeSearchText(locationText.split(",")[0]?.replace(/\d+/g, " ").replace(/\s+/g, " ").trim() ?? "");
}

function fallbackCoordinatesForLocation(locationText: string): Coordinates {
  const normalized = locationText.toLowerCase();
  if (normalized.includes("centenario")) {
    return { latitude: -32.1333, longitude: -56.4667 };
  }

  if (normalized.includes("paso de los toros")) {
    return { latitude: -32.8167, longitude: -56.5167 };
  }

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
      headers: {
        "User-Agent": "ASESPRO/1.0 contacto@asespro.uy",
      },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!response.ok) {
      return fallback;
    }

    const results = (await response.json()) as NominatimResult[];
    const streetNeedle = getStreetNeedle(locationText);
    const first =
      results.find((result) => {
        const haystack = normalizeSearchText(`${result.name ?? ""} ${result.display_name ?? ""}`);
        return streetNeedle.length > 0 && haystack.includes(streetNeedle);
      }) ?? results[0];
    const latitude = first?.lat ? Number(first.lat) : NaN;
    const longitude = first?.lon ? Number(first.lon) : NaN;

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireAdminUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 500 });
  }

  const featuredQuery = await supabase
    .from("asespro_listings")
    .select(LISTINGS_SELECT_WITH_FEATURED)
    .order("created_at", { ascending: false });

  if (featuredQuery.error) {
    if (!isMissingFeaturedColumn(featuredQuery.error.message)) {
      return NextResponse.json({ error: featuredQuery.error.message }, { status: 500 });
    }
    const fallbackQuery = await supabase
      .from("asespro_listings")
      .select(LISTINGS_SELECT_FALLBACK)
      .order("created_at", { ascending: false });
    if (fallbackQuery.error) {
      return NextResponse.json({ error: fallbackQuery.error.message }, { status: 500 });
    }
    return NextResponse.json({ data: fallbackQuery.data });
  }

  return NextResponse.json({ data: featuredQuery.data });
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
    const geocoded = await geocodeLocation(input.locationText);
    const latitude = input.latitude ?? geocoded.latitude;
    const longitude = input.longitude ?? geocoded.longitude;
    let propertyId = input.propertyId;
    const sourceListingPropertyId = propertyId;

    if (!propertyId) {
      const { data: property, error: propertyError } = await supabase
        .from("asespro_properties")
        .insert({
          title: input.title,
          description: input.description,
          property_type: input.propertyType,
          location_text: input.locationText,
          latitude,
          longitude,
          bedrooms: input.bedrooms,
          bathrooms: input.bathrooms,
          area_m2: input.areaM2,
          for_sale: input.forSale,
          sale_price: input.salePrice,
          sale_currency: input.saleCurrency,
          for_rent: input.forRent,
          rent_price: input.rentPrice,
          rent_currency: input.rentCurrency,
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
          latitude,
          longitude,
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

    const operation = input.operations[0];
    const priceAmount = operation === "alquiler" ? input.rentPrice : input.salePrice;
    const priceCurrency = operation === "alquiler" ? input.rentCurrency : input.saleCurrency;

    const listingInsert = {
      property_id: propertyId,
      title: input.title,
      description: input.description,
      price_amount: priceAmount,
      price_currency: priceCurrency,
      is_featured: input.isFeatured === true,
      status: input.status,
      published_at: input.status === "activo" ? new Date().toISOString() : null,
    };
    let listingResponse = await supabase.from("asespro_listings").insert(listingInsert).select("id").single();
    if (listingResponse.error && isMissingFeaturedColumn(listingResponse.error.message)) {
      if (input.isFeatured === true) {
        await wait(1200);
        listingResponse = await supabase.from("asespro_listings").insert(listingInsert).select("id").single();
        if (listingResponse.error && isMissingFeaturedColumn(listingResponse.error.message)) {
          return NextResponse.json({ error: "Falta migracion de base de datos para destacados. Ejecuta Docs/sql/2026-05-02_add_is_featured_to_listings.sql." }, { status: 409 });
        }
      } else {
        const { is_featured: _dropFeatured, ...fallbackInsert } = listingInsert;
        listingResponse = await supabase.from("asespro_listings").insert(fallbackInsert).select("id").single();
      }
    }
    const listing = listingResponse.data;
    const listingError = listingResponse.error;

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

    if (sourceListingPropertyId) {
      const { data: sourceListing } = await supabase
        .from("asespro_listings")
        .select("id")
        .eq("property_id", sourceListingPropertyId)
        .neq("id", listing.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sourceListing?.id) {
        const { data: sourceMedia, error: mediaReadError } = await supabase
          .from("asespro_listing_media")
          .select("media_type,storage_path,public_url,sort_order,is_cover")
          .eq("listing_id", sourceListing.id);

        if (mediaReadError) {
          return NextResponse.json({ error: mediaReadError.message }, { status: 500 });
        }

        if (sourceMedia && sourceMedia.length > 0) {
          const { error: mediaCopyError } = await supabase.from("asespro_listing_media").insert(
            sourceMedia.map((media) => ({
              ...media,
              listing_id: listing.id,
            })),
          );
          if (mediaCopyError) {
            return NextResponse.json({ error: mediaCopyError.message }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({ id: listing.id, propertyId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Datos invalidos." }, { status: 400 });
  }
}
