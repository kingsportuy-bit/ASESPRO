import type { PropertyCurrency, PropertyOperation } from "@/lib/properties";
import type { AdminListing, AdminMedia } from "./adminTypes";

export function formatMoney(amount: number | null, currency: PropertyCurrency | null): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "Sin precio";
  const normalizedCurrency = currency || "USD";
  try {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${normalizedCurrency} ${new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(amount)}`;
  }
}

export function operationLabel(operations: Array<{ operation: PropertyOperation }>): string {
  const values = operations.map((item) => item.operation);
  if (values.includes("alquiler") && values.includes("venta")) return "Alquiler / Venta";
  return values[0] === "venta" ? "Venta" : "Alquiler";
}

export function getListingMedia(listing: AdminListing): AdminMedia[] {
  const propertyMedia = listing.asespro_properties?.asespro_property_media ?? [];
  const media = propertyMedia.length > 0 ? propertyMedia : listing.asespro_listing_media;
  return media.filter((item) => item.is_visible !== false);
}

export function getObjectPosition(media?: AdminMedia | null): string {
  const focalX = typeof media?.focal_x === "number" ? media.focal_x : 50;
  const focalY = typeof media?.focal_y === "number" ? media.focal_y : 50;
  return `${Math.min(100, Math.max(0, focalX))}% ${Math.min(100, Math.max(0, focalY))}%`;
}

export function listingHasMediaIssue(listing: AdminListing): boolean {
  const media = getListingMedia(listing);
  const photos = media.filter((item) => item.media_type === "photo").length;
  const hasVideo = media.some((item) => item.media_type === "video");
  return photos === 0 || !hasVideo;
}

export function getListingQuality(listing: AdminListing): { score: number; issues: string[] } {
  const media = getListingMedia(listing);
  const photos = media.filter((item) => item.media_type === "photo").length;
  const hasVideo = media.some((item) => item.media_type === "video");
  const issues: string[] = [];

  if (photos === 0) issues.push("Sin portada");
  if (photos > 0 && photos < 5) issues.push("Pocas fotos");
  if (!hasVideo) issues.push("Sin video");
  if (typeof listing.price_amount !== "number") issues.push("Sin precio");
  if (!listing.public_summary?.trim()) issues.push("Sin resumen");
  if (!listing.seo_description?.trim()) issues.push("Sin SEO");
  if (listing.visibility !== "web") issues.push("Visibilidad limitada");
  if (listing.publish_status && listing.publish_status !== "publicado") issues.push(`Workflow: ${listing.publish_status}`);

  return { score: Math.max(0, 100 - issues.length * 14), issues };
}

export function reorderMediaItems(items: AdminMedia[], fromId: string, toId: string): AdminMedia[] {
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;
  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}
