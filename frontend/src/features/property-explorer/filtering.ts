import type { MapBounds } from "@/components/map";
import { propertyMatchesOperation } from "@/lib/properties";

import type { PropertyListing, PropertyOperation, PropertyType } from "./types";

export function isWithinBounds(property: PropertyListing, bounds: MapBounds): boolean {
  if (property.approximateRadius) {
    const latRadius = property.approximateRadius / 111320;
    const lngRadius = latRadius / Math.cos(property.lat * Math.PI / 180);
    return property.lat - latRadius <= bounds.north && property.lat + latRadius >= bounds.south && property.lng - lngRadius <= bounds.east && property.lng + lngRadius >= bounds.west;
  }
  return (
    property.lat <= bounds.north &&
    property.lat >= bounds.south &&
    property.lng <= bounds.east &&
    property.lng >= bounds.west
  );
}

export function matchesFilters(
  property: PropertyListing,
  operation: PropertyOperation | "all",
  propertyType: PropertyType | "all",
  maxPrice: number | null,
  locationQuery: string,
): boolean {
  const operationOk = operation === "all" ? true : propertyMatchesOperation(property, operation);
  const typeOk = propertyType === "all" ? true : property.type === propertyType;
  const priceOk = maxPrice === null ? true : typeof property.price === "number" && property.price <= maxPrice;
  const normalizedQuery = locationQuery.trim().toLowerCase();
  const locationOk = normalizedQuery.length === 0 ? true : property.location.toLowerCase().includes(normalizedQuery);

  return operationOk && typeOk && priceOk && locationOk;
}
