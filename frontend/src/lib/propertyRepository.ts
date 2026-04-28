import { MOCK_PROPERTIES } from "@/data/mockProperties";

import type { PropertyListing, PropertyOperation } from "./properties";

type ListOptions = {
  operation?: PropertyOperation;
};

type PropertiesApiResponse = {
  data?: unknown[];
  items?: unknown[];
};

export interface PropertyRepository {
  list(options?: ListOptions): Promise<PropertyListing[]>;
  getById(id: string): Promise<PropertyListing | null>;
}

function normalizeProperty(input: unknown): PropertyListing | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const source = input as Record<string, unknown>;
  const id = typeof source.id === "string" ? source.id : null;
  const title = typeof source.title === "string" ? source.title : null;
  const description = typeof source.description === "string" ? source.description : "";
  const location = typeof source.location === "string" ? source.location : "";
  const type = source.type === "casa" || source.type === "apartamento" || source.type === "terreno" ? source.type : null;
  const operation = source.operation === "alquiler" || source.operation === "venta" ? source.operation : null;
  const lat = typeof source.lat === "number" ? source.lat : typeof source.latitude === "number" ? source.latitude : null;
  const lng = typeof source.lng === "number" ? source.lng : typeof source.longitude === "number" ? source.longitude : null;

  if (!id || !title || !type || !operation || lat === null || lng === null) {
    return null;
  }

  return {
    id,
    title,
    description,
    location,
    type,
    operation,
    lat,
    lng,
    price: typeof source.price === "number" ? source.price : undefined,
    bedrooms: typeof source.bedrooms === "number" ? source.bedrooms : undefined,
    bathrooms: typeof source.bathrooms === "number" ? source.bathrooms : undefined,
    areaM2: typeof source.areaM2 === "number" ? source.areaM2 : typeof source.area_m2 === "number" ? source.area_m2 : undefined,
    status:
      source.status === "activo" || source.status === "desactivado" || source.status === "alquilado" || source.status === "vendido"
        ? source.status
        : "activo",
    photoUrls: Array.isArray(source.photoUrls) ? source.photoUrls.filter((item): item is string => typeof item === "string") : [],
    videoUrl: typeof source.videoUrl === "string" ? source.videoUrl : undefined,
  };
}

class MockPropertyRepository implements PropertyRepository {
  async list(options: ListOptions = {}): Promise<PropertyListing[]> {
    const { operation } = options;
    if (!operation) {
      return MOCK_PROPERTIES;
    }

    return MOCK_PROPERTIES.filter((property) => property.operation === operation);
  }

  async getById(id: string): Promise<PropertyListing | null> {
    return MOCK_PROPERTIES.find((property) => property.id === id) ?? null;
  }
}

class ApiPropertyRepository implements PropertyRepository {
  constructor(private readonly apiBaseUrl: string) {}

  async list(options: ListOptions = {}): Promise<PropertyListing[]> {
    const url = new URL("/properties", this.apiBaseUrl);
    if (options.operation) {
      url.searchParams.set("operation", options.operation);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Properties API list failed (${response.status})`);
    }

    const payload = (await response.json()) as PropertiesApiResponse | unknown[];
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.items)
          ? payload.items
          : [];

    return items.map((item) => normalizeProperty(item)).filter((item): item is PropertyListing => item !== null);
  }

  async getById(id: string): Promise<PropertyListing | null> {
    const url = new URL(`/properties/${id}`, this.apiBaseUrl);
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Properties API getById failed (${response.status})`);
    }

    const payload = (await response.json()) as unknown;
    return normalizeProperty(payload);
  }
}

function createPropertyRepository(): PropertyRepository {
  const source = process.env.PROPERTY_DATA_SOURCE ?? "mock";
  if (source !== "api") {
    return new MockPropertyRepository();
  }

  const apiBaseUrl = process.env.PROPERTIES_API_BASE_URL;
  if (!apiBaseUrl) {
    return new MockPropertyRepository();
  }

  return new ApiPropertyRepository(apiBaseUrl);
}

export const propertyRepository = createPropertyRepository();

export async function listPublicProperties(): Promise<PropertyListing[]> {
  return propertyRepository.list();
}

export async function listPublicPropertiesByOperation(operation: PropertyOperation): Promise<PropertyListing[]> {
  return propertyRepository.list({ operation });
}

export async function getPublicPropertyById(id: string): Promise<PropertyListing | null> {
  return propertyRepository.getById(id);
}
