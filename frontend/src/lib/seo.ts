import type { Metadata } from "next";

export const SITE_NAME = "ASESPRO";
export const SITE_DESCRIPTION =
  "Alquiler y venta de casas, apartamentos y terrenos en Paso de los Toros, Pueblo Centenario y alrededores. Consulta propiedades y contacta a ASESPRO.";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://inmobiliaria.asespro.kodebix.com").replace(/\/$/, "");
}

export function createPageMetadata({
  title,
  description,
  path,
  image = "/HERO_ASESPRO.png",
  imageAlt = "Inmobiliaria ASESPRO en Paso de los Toros",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "es_UY",
      type: "website",
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&]/g, (character) => {
    const escapes: Record<string, string> = { "<": "\\u003c", ">": "\\u003e", "&": "\\u0026" };
    return escapes[character];
  });
}
