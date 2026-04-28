import type { MapBounds } from "@/components/map";

import type { PropertyListing, PropertyOperation, PropertyType } from "./types";

export function isWithinBounds(property: PropertyListing, bounds: MapBounds): boolean {
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
  const operationOk = operation === "all" ? true : property.operation === operation;
  const typeOk = propertyType === "all" ? true : property.type === propertyType;
  const priceOk = maxPrice === null ? true : typeof property.price === "number" && property.price <= maxPrice;
  const normalizedQuery = locationQuery.trim().toLowerCase();
  const locationOk = normalizedQuery.length === 0 ? true : property.location.toLowerCase().includes(normalizedQuery);

  return operationOk && typeOk && priceOk && locationOk;
}
