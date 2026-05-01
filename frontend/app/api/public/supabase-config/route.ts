import { NextResponse } from "next/server";

import { getSupabasePublicConfig } from "@/lib/supabaseServer";

export async function GET(): Promise<NextResponse> {
  const config = getSupabasePublicConfig();
  if (!config) {
    return NextResponse.json({ error: "Supabase publico no esta configurado." }, { status: 500 });
  }

  return NextResponse.json(config);
}
