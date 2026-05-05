import { getSupabaseAdminClient } from "./supabaseServer";

export async function requireAdminUser(request: Request): Promise<{ ok: true; userId: string } | { ok: false; status: number; message: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, status: 500, message: "Supabase no está configurado." };
  }

  const testKey = request.headers.get("x-asespro-test-key");
  if (
    process.env.ASESPRO_ENABLE_UPLOAD_TESTS === "true" &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    testKey === process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return { ok: true, userId: "upload-test" };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!token) {
    return { ok: false, status: 401, message: "Sesión requerida." };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, status: 401, message: "Sesión inválida." };
  }

  return { ok: true, userId: data.user.id };
}
