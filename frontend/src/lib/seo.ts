export const SITE_NAME = "ASESPRO";
export const SITE_DESCRIPTION =
  "ASESPRO Inmobiliaria: propiedades en alquiler y venta con atencion personalizada por WhatsApp.";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
