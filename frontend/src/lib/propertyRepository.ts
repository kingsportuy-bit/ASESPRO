import { MOCK_PROPERTIES } from "@/data/mockProperties";

import type { PropertyListing, PropertyOperation } from "./properties";

type ListOptions = {
  operation?: PropertyOperation;
};

type PropertiesApiResponse = {
  data?: unknown[];
  items?: unknown[];
};

type CoordinatePair = {
  lat: number;
  lng: number;
};

type MediaLike = {
  url?: unknown;
  public_url?: unknown;
  publicUrl?: unknown;
  src?: unknown;
};

export interface PropertyRepository {
  list(options?: ListOptions): Promise<PropertyListing[]>;
  getById(id: string): Promise<PropertyListing | null>;
}

function isActiveProperty(property: PropertyListing): boolean {
  return property.status === "activo";
}

function fallbackExample(operation?: PropertyOperation): PropertyListing[] {
  const activeMock = MOCK_PROPERTIES.filter((property) => isActiveProperty(property));
  if (activeMock.length === 0) {
    return [];
  }

  if (!operation) {
    return [activeMock[0]];
  }

  const activeForOperation = activeMock.filter((property) => property.operation === operation);
  return activeForOperation.length > 0 ? [activeForOperation[0]] : [activeMock[0]];
}

function toPublicActiveList(items: PropertyListing[], operation?: PropertyOperation): PropertyListing[] {
  const activeItems = items.filter((property) => isActiveProperty(property));
  if (activeItems.length > 0) {
    return activeItems;
  }

  return fallbackExample(operation);
}

function parseCoordinateValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function readCoordinate(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = parseCoordinateValue(source[key]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function isWithinLatRange(value: number): boolean {
  return value >= -90 && value <= 90;
}

function isWithinLngRange(value: number): boolean {
  return value >= -180 && value <= 180;
}

function isLikelyUruguayCoordinate(lat: number, lng: number): boolean {
  return lat <= -30 && lat >= -35.5 && lng <= -53 && lng >= -58.5;
}

function normalizeCoordinateOrder(lat: number, lng: number): CoordinatePair | null {
  if (!isWithinLatRange(lat) || !isWithinLngRange(lng)) {
    if (isWithinLatRange(lng) && isWithinLngRange(lat)) {
      return { lat: lng, lng: lat };
    }
    return null;
  }

  if (!isLikelyUruguayCoordinate(lat, lng) && isLikelyUruguayCoordinate(lng, lat)) {
    return { lat: lng, lng: lat };
  }

  return { lat, lng };
}

function readCoordinates(source: Record<string, unknown>): CoordinatePair | null {
  const directLat = readCoordinate(source, ["lat", "latitude", "latitud"]);
  const directLng = readCoordinate(source, ["lng", "lon", "long", "longitude", "longitud"]);

  if (directLat !== null && directLng !== null) {
    return normalizeCoordinateOrder(directLat, directLng);
  }

  const coordinates = source.coordinates;
  if (coordinates && typeof coordinates === "object" && !Array.isArray(coordinates)) {
    const coordinateSource = coordinates as Record<string, unknown>;
    const nestedLat = readCoordinate(coordinateSource, ["lat", "latitude", "latitud"]);
    const nestedLng = readCoordinate(coordinateSource, ["lng", "lon", "long", "longitude", "longitud"]);

    if (nestedLat !== null && nestedLng !== null) {
      return normalizeCoordinateOrder(nestedLat, nestedLng);
    }
  }

  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const first = parseCoordinateValue(coordinates[0]);
    const second = parseCoordinateValue(coordinates[1]);
    if (first !== null && second !== null) {
      const asLatLng = normalizeCoordinateOrder(first, second);
      if (asLatLng) {
        return asLatLng;
      }
      return normalizeCoordinateOrder(second, first);
    }
  }

  if (typeof coordinates === "string") {
    const parts = coordinates.split(/[;,]/).map((part) => part.trim());
    if (parts.length >= 2) {
      const first = parseCoordinateValue(parts[0]);
      const second = parseCoordinateValue(parts[1]);
      if (first !== null && second !== null) {
        const asLatLng = normalizeCoordinateOrder(first, second);
        if (asLatLng) {
          return asLatLng;
        }
        return normalizeCoordinateOrder(second, first);
      }
    }
  }

  return null;
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
  const coordinates = readCoordinates(source);
  const lat = coordinates?.lat ?? null;
  const lng = coordinates?.lng ?? null;
  const rawPhotos =
    (Array.isArray(source.photoUrls) ? source.photoUrls : null) ??
    (Array.isArray(source.photo_urls) ? source.photo_urls : null) ??
    (Array.isArray(source.photos) ? source.photos : null) ??
    (Array.isArray(source.images) ? source.images : null);
  const photoUrls = (rawPhotos ?? [])
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        const media = item as MediaLike;
        const candidates = [media.url, media.public_url, media.publicUrl, media.src];
        for (const candidate of candidates) {
          if (typeof candidate === "string" && candidate.trim().length > 0) {
            return candidate.trim();
          }
        }
      }

      return "";
    })
    .filter((url) => url.length > 0);

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
    photoUrls,
    videoUrl: typeof source.videoUrl === "string" ? source.videoUrl : undefined,
  };
}

class MockPropertyRepository implements PropertyRepository {
  async list(options: ListOptions = {}): Promise<PropertyListing[]> {
    const { operation } = options;
    const scoped = operation ? MOCK_PROPERTIES.filter((property) => property.operation === operation) : MOCK_PROPERTIES;
    return toPublicActiveList(scoped, operation);
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

    const normalized = items.map((item) => normalizeProperty(item)).filter((item): item is PropertyListing => item !== null);
    return toPublicActiveList(normalized, options.operation);
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
