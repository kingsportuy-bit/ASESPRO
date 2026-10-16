import type { MetadataRoute } from "next";

import { listPublicProperties } from "@/lib/propertyRepository";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/alquiler",
    "/venta",
    "/contacto",
    "/mapa",
  ].map((path) => ({
    url: `${baseUrl}${path === "/" ? "/" : path}`,
  }));

  try {
    const properties = await listPublicProperties();
    const propertyRoutes: MetadataRoute.Sitemap = properties.map((property) => ({
      url: `${baseUrl}/propiedad/${property.id}`,
    }));

    return [...staticRoutes, ...propertyRoutes];
  } catch {
    return staticRoutes;
  }
}
