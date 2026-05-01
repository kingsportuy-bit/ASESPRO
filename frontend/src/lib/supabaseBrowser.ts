"use client";

import { createClient } from "@supabase/supabase-js";

type BrowserSupabaseConfig = {
  url: string;
  anonKey: string;
};

export function createSupabaseBrowserClient(config?: BrowserSupabaseConfig | null) {
  const url = config?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = config?.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
