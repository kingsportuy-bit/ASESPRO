import { MOCK_PROPERTIES } from "@/data/mockProperties";

import { buildWhatsAppUrl } from "./whatsapp";

export type PropertyType = "casa" | "apartamento" | "terreno";
export type PropertyOperation = "alquiler" | "venta";
export type PropertyStatus = "activo" | "desactivado" | "alquilado" | "vendido";
export type PropertyCurrency = string;

export type PropertyListing = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: PropertyType;
  operation: PropertyOperation;
  operations?: PropertyOperation[];
  lat: number;
  lng: number;
  price?: number;
  priceCurrency?: PropertyCurrency;
  isFeatured?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  areaM2?: number;
  status: PropertyStatus;
  photoUrls: string[];
  videoUrl?: string;
};

export function getProperties(): PropertyListing[] {
  return MOCK_PROPERTIES;
}

export function getPropertiesByOperation(operation: PropertyOperation): PropertyListing[] {
  return MOCK_PROPERTIES.filter((property) => property.operation === operation);
}

export function getPropertyById(id: string): PropertyListing | null {
  return MOCK_PROPERTIES.find((property) => property.id === id) ?? null;
}

export function getPropertyOperations(property: PropertyListing): PropertyOperation[] {
  return property.operations && property.operations.length > 0 ? property.operations : [property.operation];
}

export function propertyMatchesOperation(property: PropertyListing, operation: PropertyOperation): boolean {
  return getPropertyOperations(property).includes(operation);
}

export function formatOperationLabel(property: PropertyListing): string {
  const operations = getPropertyOperations(property);
  if (operations.includes("alquiler") && operations.includes("venta")) {
    return "Alquiler / Venta";
  }

  return operations[0] === "alquiler" ? "Alquiler" : "Venta";
}

export function getDefaultCurrencyForOperation(operation: PropertyOperation): PropertyCurrency {
  return operation === "alquiler" ? "UYU" : "USD";
}

export function formatPrice(price?: number, currency: PropertyCurrency = "USD"): string {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return "Consultar";
  }

  try {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(price)}`;
  }
}

export function buildPropertyWhatsAppUrl(property: PropertyListing, phone: string): string {
  const message = `Hola ASESPRO, quiero consultar por la propiedad ${property.id.toUpperCase()}: "${property.title}" en ${property.location} (${formatPrice(property.price, property.priceCurrency)}). Me interesa recibir mas informacion y coordinar una visita.`;
  return buildWhatsAppUrl(phone, message);
}
