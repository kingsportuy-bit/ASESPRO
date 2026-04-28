import type { MetadataRoute } from "next";

import { listPublicProperties } from "@/lib/propertyRepository";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/alquiler",
    "/venta",
    "/contacto",
    "/servicio-limpieza",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.8,
  }));

  try {
    const properties = await listPublicProperties();
    const propertyRoutes: MetadataRoute.Sitemap = properties.map((property) => ({
      url: `${baseUrl}/propiedad/${property.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    return [...staticRoutes, ...propertyRoutes];
  } catch {
    return staticRoutes;
  }
}
