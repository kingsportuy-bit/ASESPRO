import { MOCK_PROPERTIES } from "@/data/mockProperties";

import { buildWhatsAppUrl } from "./whatsapp";

export type PropertyType = "casa" | "apartamento" | "terreno";
export type PropertyOperation = "alquiler" | "venta";

export type PropertyListing = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: PropertyType;
  operation: PropertyOperation;
  lat: number;
  lng: number;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaM2?: number;
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

export function formatPrice(price?: number): string {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return "Consultar";
  }

  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function buildPropertyWhatsAppUrl(property: PropertyListing, phone: string): string {
  const message = `Hola ASESPRO, me interesa la propiedad "${property.title}" en ${property.location} (${formatPrice(property.price)}). Quiero mas informacion.`;
  return buildWhatsAppUrl(phone, message);
}
