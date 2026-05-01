import { getSupabaseAdminClient } from "./supabaseServer";

export async function requireAdminUser(request: Request): Promise<{ ok: true; userId: string } | { ok: false; status: number; message: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, status: 500, message: "Supabase no esta configurado." };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!token) {
    return { ok: false, status: 401, message: "Sesion requerida." };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, status: 401, message: "Sesion invalida." };
  }

  return { ok: true, userId: data.user.id };
}
