import { unstable_noStore as noStore } from "next/cache";

import {
  getDefaultCurrencyForOperation,
  propertyMatchesOperation,
  type PropertyCurrency,
  type PropertyListing,
  type PropertyOperation,
  type PropertyStatus,
  type PropertyType,
} from "./properties";
import { getSupabaseAdminClient } from "./supabaseServer";

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

type SupabaseListingRow = {
  id: string;
  title: string | null;
  description: string | null;
  price_amount: number | string | null;
  price_currency: string | null;
  is_featured?: boolean | null;
  status: PropertyStatus | null;
  asespro_properties:
    | SupabasePropertyRow
    | SupabasePropertyRow[]
    | null;
  asespro_listing_operations: Array<{ operation: PropertyOperation | null }> | null;
  asespro_listing_media:
    | Array<{
        media_type: "photo" | "video" | null;
        public_url: string | null;
        storage_path: string | null;
        sort_order: number | null;
        is_cover: boolean | null;
      }>
    | null;
};

const PUBLIC_LISTINGS_SELECT_WITH_FEATURED =
  "id,title,description,price_amount,price_currency,is_featured,status,asespro_properties(title,description,property_type,location_text,latitude,longitude,bedrooms,bathrooms,area_m2,is_active,asespro_property_media(media_type,public_url,storage_path,sort_order,is_cover)),asespro_listing_operations(operation),asespro_listing_media(media_type,public_url,storage_path,sort_order,is_cover)";
const PUBLIC_LISTINGS_SELECT_FALLBACK =
  "id,title,description,price_amount,price_currency,status,asespro_properties(title,description,property_type,location_text,latitude,longitude,bedrooms,bathrooms,area_m2,is_active,asespro_property_media(media_type,public_url,storage_path,sort_order,is_cover)),asespro_listing_operations(operation),asespro_listing_media(media_type,public_url,storage_path,sort_order,is_cover)";

function isMissingFeaturedColumn(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("is_featured") && normalized.includes("column");
}

type SupabaseMediaRow = {
  media_type: "photo" | "video" | null;
  public_url: string | null;
  storage_path: string | null;
  sort_order: number | null;
  is_cover: boolean | null;
};

type SupabasePropertyRow = {
        title: string | null;
        description: string | null;
        property_type: string | null;
        location_text: string | null;
        latitude: number | string | null;
        longitude: number | string | null;
        bedrooms: number | null;
        bathrooms: number | null;
        area_m2: number | string | null;
        is_active: boolean | null;
        asespro_property_media?: SupabaseMediaRow[] | null;
};

export interface PropertyRepository {
  list(options?: ListOptions): Promise<PropertyListing[]>;
  getById(id: string): Promise<PropertyListing | null>;
}

function isActiveProperty(property: PropertyListing): boolean {
  return property.status === "activo";
}

function toPublicActiveList(items: PropertyListing[], operation?: PropertyOperation): PropertyListing[] {
  const activeItems = items.filter((property) => isActiveProperty(property));
  return activeItems;
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
    isFeatured: source.isFeatured === true || source.is_featured === true,
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

function parseNumber(value: unknown): number | undefined {
  const parsed = parseCoordinateValue(value);
  return parsed ?? undefined;
}

function normalizePropertyType(value: string | null | undefined): PropertyType {
  if (value === "casa" || value === "apartamento" || value === "terreno") {
    return value;
  }

  return "casa";
}

function normalizeCurrency(value: string | null | undefined, operation: PropertyOperation): PropertyCurrency {
  return value?.trim() || getDefaultCurrencyForOperation(operation);
}

function defaultCoordinatesForLocation(location: string | null | undefined): CoordinatePair | null {
  const normalized = location?.toLowerCase() ?? "";
  if (normalized.includes("centenario")) {
    return { lat: -32.1333, lng: -56.4667 };
  }

  if (normalized.includes("paso de los toros")) {
    return { lat: -32.8167, lng: -56.5167 };
  }

  return null;
}

function normalizeSupabaseListing(row: SupabaseListingRow): PropertyListing | null {
  const property = Array.isArray(row.asespro_properties) ? row.asespro_properties[0] : row.asespro_properties;
  if (!property || property.is_active === false) {
    return null;
  }

  const fallbackCoordinates = defaultCoordinatesForLocation(property.location_text);
  const lat = parseCoordinateValue(property.latitude) ?? fallbackCoordinates?.lat ?? null;
  const lng = parseCoordinateValue(property.longitude) ?? fallbackCoordinates?.lng ?? null;
  if (lat === null || lng === null) {
    return null;
  }

  const operations = (row.asespro_listing_operations ?? [])
    .map((item) => item.operation)
    .filter((operation): operation is PropertyOperation => operation === "alquiler" || operation === "venta");
  const primaryOperation = operations[0] ?? "venta";
  const sourceMedia = property.asespro_property_media?.length ? property.asespro_property_media : row.asespro_listing_media ?? [];
  const media = [...sourceMedia].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const photoUrls = media
    .filter((item) => item.media_type === "photo")
    .map((item) => item.public_url ?? item.storage_path ?? "")
    .filter((url) => url.length > 0);
  const videoUrl =
    media.find((item) => item.media_type === "video")?.public_url ??
    media.find((item) => item.media_type === "video")?.storage_path ??
    undefined;

  return {
    id: row.id,
    title: property.title ?? row.title ?? "Propiedad ASESPRO",
    description: property.description ?? row.description ?? "",
    location: property.location_text ?? "",
    type: normalizePropertyType(property.property_type),
    operation: primaryOperation,
    operations: operations.length > 0 ? operations : [primaryOperation],
    lat,
    lng,
    price: parseNumber(row.price_amount),
    priceCurrency: normalizeCurrency(row.price_currency, primaryOperation),
    bedrooms: property.bedrooms ?? undefined,
    bathrooms: property.bathrooms ?? undefined,
    areaM2: parseNumber(property.area_m2),
    status: row.status ?? "desactivado",
    isFeatured: row.is_featured === true,
    photoUrls,
    videoUrl,
  };
}

class SupabasePropertyRepository implements PropertyRepository {
  async list(options: ListOptions = {}): Promise<PropertyListing[]> {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return [];
    }

    const featuredQuery = await supabase
      .from("asespro_listings")
      .select(PUBLIC_LISTINGS_SELECT_WITH_FEATURED)
      .eq("status", "activo")
      .order("created_at", { ascending: false });

    let data = featuredQuery.data as SupabaseListingRow[] | null;
    let error = featuredQuery.error;
    if (error && isMissingFeaturedColumn(error.message)) {
      const fallbackQuery = await supabase
        .from("asespro_listings")
        .select(PUBLIC_LISTINGS_SELECT_FALLBACK)
        .eq("status", "activo")
        .order("created_at", { ascending: false });
      data = fallbackQuery.data as SupabaseListingRow[] | null;
      error = fallbackQuery.error;
    }

    if (error || !data) {
      return [];
    }

    const normalized = data
      .map((row) => normalizeSupabaseListing(row))
      .filter((property): property is PropertyListing => property !== null);
    const scoped = options.operation
      ? normalized.filter((property) => propertyMatchesOperation(property, options.operation as PropertyOperation))
      : normalized;

    return toPublicActiveList(scoped, options.operation);
  }

  async getById(id: string): Promise<PropertyListing | null> {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return null;
    }

    const featuredQuery = await supabase
      .from("asespro_listings")
      .select(PUBLIC_LISTINGS_SELECT_WITH_FEATURED)
      .eq("id", id)
      .maybeSingle();
    let data = featuredQuery.data as SupabaseListingRow | null;
    let error = featuredQuery.error;
    if (error && isMissingFeaturedColumn(error.message)) {
      const fallbackQuery = await supabase
        .from("asespro_listings")
        .select(PUBLIC_LISTINGS_SELECT_FALLBACK)
        .eq("id", id)
        .maybeSingle();
      data = fallbackQuery.data as SupabaseListingRow | null;
      error = fallbackQuery.error;
    }

    if (error || !data) {
      return null;
    }

    return normalizeSupabaseListing(data);
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
  const source = process.env.PROPERTY_DATA_SOURCE ?? "supabase";
  if (source === "supabase") {
    return new SupabasePropertyRepository();
  }

  if (source !== "api") {
    return new SupabasePropertyRepository();
  }

  const apiBaseUrl = process.env.PROPERTIES_API_BASE_URL;
  if (!apiBaseUrl) {
    return new SupabasePropertyRepository();
  }

  return new ApiPropertyRepository(apiBaseUrl);
}

export const propertyRepository = createPropertyRepository();

export async function listPublicProperties(): Promise<PropertyListing[]> {
  noStore();
  return propertyRepository.list();
}

export async function listPublicPropertiesByOperation(operation: PropertyOperation): Promise<PropertyListing[]> {
  noStore();
  return propertyRepository.list({ operation });
}

export async function getPublicPropertyById(id: string): Promise<PropertyListing | null> {
  noStore();
  return propertyRepository.getById(id);
}
