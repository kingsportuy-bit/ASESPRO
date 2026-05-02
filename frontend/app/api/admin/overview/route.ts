import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/adminAuth";
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

  const [listings, properties, owners, rentals] = await Promise.all([
    supabase
      .from("asespro_listings")
      .select(
        "id,property_id,title,description,price_amount,price_currency,status,created_at,asespro_properties(title,description,property_type,location_text,latitude,longitude,bedrooms,bathrooms,area_m2,for_sale,sale_price,sale_currency,for_rent,rent_price,rent_currency,asespro_property_media(id,media_type,public_url,storage_path,sort_order,is_cover)),asespro_listing_operations(operation),asespro_listing_media(id,media_type,public_url,storage_path,sort_order,is_cover)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("asespro_properties")
      .select("id,code,title,description,property_type,location_text,latitude,longitude,is_active,status,bedrooms,bathrooms,area_m2,for_sale,sale_price,sale_currency,for_rent,rent_price,rent_currency,created_at,asespro_property_owners(owner_id),asespro_property_media(id,media_type,public_url,storage_path,sort_order,is_cover)")
      .order("created_at", { ascending: false }),
    supabase.from("asespro_owners").select("id,full_name,phone,email,notes,created_at").order("created_at", { ascending: false }),
    supabase
      .from("asespro_rentals")
      .select("id,property_id,client_id,monthly_price,start_date,end_date,status,created_at")
      .eq("status", "activo")
      .order("created_at", { ascending: false }),
  ]);

  const firstError = listings.error ?? properties.error ?? owners.error ?? rentals.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    listings: listings.data ?? [],
    properties: properties.data ?? [],
    owners: owners.data ?? [],
    activeRentals: rentals.data ?? [],
  });
}
