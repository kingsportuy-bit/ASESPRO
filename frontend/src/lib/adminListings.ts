import type { PropertyCurrency, PropertyOperation, PropertyStatus, PropertyType } from "./properties";

export type AdminListingInput = {
  ownerId?: string;
  propertyId?: string;
  syncPropertyData?: boolean;
  isFeatured?: boolean;
  title: string;
  description: string;
  propertyType: PropertyType;
  locationText: string;
  latitude?: number | null;
  longitude?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
  forSale: boolean;
  salePrice?: number | null;
  saleCurrency: PropertyCurrency;
  forRent: boolean;
  rentPrice?: number | null;
  rentCurrency: PropertyCurrency;
  operations: PropertyOperation[];
  status: PropertyStatus;
};

export function normalizeAdminListingInput(input: unknown): AdminListingInput {
  if (!input || typeof input !== "object") {
    throw new Error("Datos invalidos.");
  }

  const source = input as Record<string, unknown>;
  const operations = Array.isArray(source.operations)
    ? source.operations.filter((operation): operation is PropertyOperation => operation === "alquiler" || operation === "venta")
    : [];
  if (operations.length === 0) {
    throw new Error("Selecciona al menos una operacion.");
  }

  const title = typeof source.title === "string" ? source.title.trim() : "";
  const locationText = typeof source.locationText === "string" ? source.locationText.trim() : "";
  const latitude = toOptionalNumber(source.latitude);
  const longitude = toOptionalNumber(source.longitude);
  if (!title || !locationText) {
    throw new Error("Titulo y direccion son obligatorios.");
  }

  const propertyType =
    source.propertyType === "casa" || source.propertyType === "apartamento" || source.propertyType === "terreno"
      ? source.propertyType
      : "casa";
  const status =
    source.status === "activo" || source.status === "desactivado" || source.status === "alquilado" || source.status === "vendido"
      ? source.status
      : "desactivado";
  const saleCurrency = typeof source.saleCurrency === "string" && source.saleCurrency.trim() ? source.saleCurrency.trim().toUpperCase() : "USD";
  const rentCurrency = typeof source.rentCurrency === "string" && source.rentCurrency.trim() ? source.rentCurrency.trim().toUpperCase() : "UYU";
  const forSale = source.forSale === true;
  const forRent = source.forRent === true;

  return {
    ownerId: typeof source.ownerId === "string" && source.ownerId ? source.ownerId : undefined,
    propertyId: typeof source.propertyId === "string" && source.propertyId ? source.propertyId : undefined,
    syncPropertyData: source.syncPropertyData !== false,
    isFeatured: source.isFeatured === true,
    title,
    description: typeof source.description === "string" ? source.description.trim() : "",
    propertyType,
    locationText,
    latitude,
    longitude,
    bedrooms: toOptionalNumber(source.bedrooms),
    bathrooms: toOptionalNumber(source.bathrooms),
    areaM2: toOptionalNumber(source.areaM2),
    forSale,
    salePrice: toOptionalNumber(source.salePrice),
    saleCurrency,
    forRent,
    rentPrice: toOptionalNumber(source.rentPrice),
    rentCurrency,
    operations,
    status,
  };
}

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}
