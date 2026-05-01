export const SITE_NAME = "ASESPRO";
export const SITE_DESCRIPTION =
  "Alquiler y venta de casas, apartamentos y terrenos en Paso de los Toros, Pueblo Centenario y alrededores. Consulta propiedades y contacta a ASESPRO.";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
