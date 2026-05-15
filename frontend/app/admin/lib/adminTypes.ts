import type { PropertyAmenityKey, PropertyCurrency, PropertyOperation, PropertyStatus, PropertyType } from "@/lib/properties";

export type AdminMedia = {
  id: string;
  media_type: "photo" | "video";
  public_url: string | null;
  storage_path?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
  alt_text?: string | null;
  caption?: string | null;
  focal_x?: number | null;
  focal_y?: number | null;
  is_visible?: boolean | null;
  quality_status?: string | null;
};

export type MediaUploadProgress = {
  label: string;
  percent: number;
};

export type MediaUploadResponse = {
  media?: AdminMedia;
  error?: string;
};

export type ChunkedUploadInitResponse = {
  uploadId?: string;
  chunkSize?: number;
  error?: string;
};

export type PublishStatus = "borrador" | "revision" | "publicado" | "pausado" | "archivado";
export type ListingVisibility = "web" | "privado" | "link_directo";
export type PropertyOperationalStatus = "disponible" | "alquilado" | "vendido";

export type AdminListing = {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  price_amount: number | null;
  price_currency: PropertyCurrency | null;
  is_featured?: boolean | null;
  slug?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  public_summary?: string | null;
  internal_notes?: string | null;
  publish_status?: PublishStatus | null;
  visibility?: ListingVisibility | null;
  featured_order?: number | null;
  homepage_section?: string | null;
  status: PropertyStatus;
  created_at?: string;
  asespro_properties: {
    title?: string | null;
    description?: string | null;
    property_type: PropertyType;
    location_text: string | null;
    latitude: number | null;
    longitude: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    area_m2: number | null;
    for_sale?: boolean | null;
    sale_price?: number | null;
    sale_currency?: PropertyCurrency | null;
    for_rent?: boolean | null;
    rent_price?: number | null;
    rent_currency?: PropertyCurrency | null;
    has_garage?: boolean | null;
    has_patio?: boolean | null;
    has_laundry?: boolean | null;
    has_living?: boolean | null;
    has_dining?: boolean | null;
    has_kitchen?: boolean | null;
    has_balcony?: boolean | null;
    has_security?: boolean | null;
    has_pool?: boolean | null;
    asespro_property_media?: AdminMedia[];
  } | null;
  asespro_listing_operations: Array<{ operation: PropertyOperation }>;
  asespro_listing_media: AdminMedia[];
};

export type AdminProperty = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  property_type: PropertyType;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  status: PropertyOperationalStatus;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  for_sale?: boolean | null;
  sale_price?: number | null;
  sale_currency?: PropertyCurrency | null;
  for_rent?: boolean | null;
  rent_price?: number | null;
  rent_currency?: PropertyCurrency | null;
  has_garage?: boolean | null;
  has_patio?: boolean | null;
  has_laundry?: boolean | null;
  has_living?: boolean | null;
  has_dining?: boolean | null;
  has_kitchen?: boolean | null;
  has_balcony?: boolean | null;
  has_security?: boolean | null;
  has_pool?: boolean | null;
  asespro_property_owners?: Array<{ owner_id: string }>;
  asespro_property_media?: AdminMedia[];
};

export type AdminOwner = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type ActiveRental = {
  id: string;
  monthly_price: number;
  start_date: string;
  end_date: string | null;
  status: string;
};

export type OverviewPayload = {
  listings: AdminListing[];
  properties: AdminProperty[];
  owners: AdminOwner[];
  activeRentals: ActiveRental[];
  error?: string;
};

export type FormState = {
  id: string | null;
  isFeatured: boolean;
  ownerId: string;
  ownerMode: "existing" | "new";
  newOwnerFullName: string;
  newOwnerPhone: string;
  newOwnerEmail: string;
  newOwnerNotes: string;
  propertyId: string;
  propertyMode: "existing" | "new";
  syncPropertyData: boolean;
  title: string;
  description: string;
  propertyType: PropertyType;
  locationText: string;
  street: string;
  streetNumber: string;
  city: "Paso de los Toros" | "Centenario";
  department: "Tacuarembo" | "Durazno";
  country: "Uruguay";
  bedrooms: string;
  bathrooms: string;
  areaM2: string;
  forSale: boolean;
  salePrice: string;
  saleCurrency: PropertyCurrency;
  forRent: boolean;
  rentPrice: string;
  rentCurrency: PropertyCurrency;
  amenities: Record<PropertyAmenityKey, boolean>;
  operations: PropertyOperation[];
  status: PropertyStatus;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  publicSummary: string;
  internalNotes: string;
  publishStatus: PublishStatus;
  visibility: ListingVisibility;
  featuredOrder: string;
  homepageSection: string;
};

export type OwnerFormState = {
  id: string | null;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
};

export type PropertyFormState = {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  locationText: string;
  bedrooms: string;
  bathrooms: string;
  areaM2: string;
  status: PropertyOperationalStatus;
  forSale: boolean;
  salePrice: string;
  saleCurrency: PropertyCurrency;
  forRent: boolean;
  rentPrice: string;
  rentCurrency: PropertyCurrency;
  amenities: Record<PropertyAmenityKey, boolean>;
};

export type PanelTab = "resumen" | "publicaciones" | "inmuebles" | "propietarios" | "alquileres";
export type DrawerMode = "listing" | "owner" | "property" | "publication" | null;
export type ListingFilter = "todos" | PropertyStatus;
export type ListingWizardStep = "propietario" | "inmueble" | "publicacion";
