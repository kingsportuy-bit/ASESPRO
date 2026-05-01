import { getDefaultCurrencyForOperation, type PropertyCurrency, type PropertyOperation, type PropertyStatus, type PropertyType } from "./properties";

export type AdminListingInput = {
  propertyId?: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  locationText: string;
  latitude: number;
  longitude: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaM2?: number | null;
  priceAmount?: number | null;
  priceCurrency?: PropertyCurrency;
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
  const latitude = Number(source.latitude);
  const longitude = Number(source.longitude);
  if (!title || !locationText || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Titulo, ubicacion y coordenadas son obligatorios.");
  }

  const propertyType =
    source.propertyType === "casa" || source.propertyType === "apartamento" || source.propertyType === "terreno"
      ? source.propertyType
      : "casa";
  const status =
    source.status === "activo" || source.status === "desactivado" || source.status === "alquilado" || source.status === "vendido"
      ? source.status
      : "desactivado";
  const priceCurrency =
    source.priceCurrency === "UYU" || source.priceCurrency === "USD"
      ? source.priceCurrency
      : getDefaultCurrencyForOperation(operations[0]);

  return {
    propertyId: typeof source.propertyId === "string" && source.propertyId ? source.propertyId : undefined,
    title,
    description: typeof source.description === "string" ? source.description.trim() : "",
    propertyType,
    locationText,
    latitude,
    longitude,
    bedrooms: toOptionalNumber(source.bedrooms),
    bathrooms: toOptionalNumber(source.bathrooms),
    areaM2: toOptionalNumber(source.areaM2),
    priceAmount: toOptionalNumber(source.priceAmount),
    priceCurrency,
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
