"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { PropertyAmenityKey, PropertyCurrency, PropertyOperation, PropertyStatus, PropertyType } from "@/lib/properties";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

import type {
  ActiveRental,
  AdminListing,
  AdminMedia,
  AdminOwner,
  AdminProperty,
  ChunkedUploadInitResponse,
  DrawerMode,
  FormState,
  ListingFilter,
  ListingWizardStep,
  MediaUploadProgress,
  MediaUploadResponse,
  OverviewPayload,
  OwnerFormState,
  PanelTab,
  PropertyFormState,
  PropertyOperationalStatus,
} from "./lib/adminTypes";
import { formatMoney, getListingMedia, getObjectPosition, listingHasMediaIssue, operationLabel } from "./lib/adminUtils";
import { ListingTable } from "./components/ListingTable";
import { MediaSection } from "./components/MediaSection";
import styles from "./AdminPanel.module.css";

const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;
const MAX_VIDEO_SIZE_LABEL = "500 MB";
const RESUMABLE_VIDEO_CHUNK_BYTES = 6 * 1024 * 1024;
const REQUIRED_VIDEO_MIME = "video/mp4";
const REQUIRED_VIDEO_CODECS = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

const EMPTY_AMENITIES: Record<PropertyAmenityKey, boolean> = {
  garage: false,
  patio: false,
  laundry: false,
  living: false,
  dining: false,
  kitchen: false,
  balcony: false,
  security: false,
  pool: false,
};

const PROPERTY_AMENITIES: Array<{ key: PropertyAmenityKey; dbKey: keyof AdminProperty; label: string }> = [
  { key: "garage", dbKey: "has_garage", label: "Garaje" },
  { key: "patio", dbKey: "has_patio", label: "Patio / jardín" },
  { key: "laundry", dbKey: "has_laundry", label: "Lavadero" },
  { key: "living", dbKey: "has_living", label: "Living / estar" },
  { key: "dining", dbKey: "has_dining", label: "Comedor" },
  { key: "kitchen", dbKey: "has_kitchen", label: "Cocina" },
  { key: "balcony", dbKey: "has_balcony", label: "Balcón" },
  { key: "security", dbKey: "has_security", label: "Seguridad" },
  { key: "pool", dbKey: "has_pool", label: "Pileta" },
];

const EMPTY_LISTING_FORM: FormState = {
  id: null,
  isFeatured: false,
  ownerId: "",
  ownerMode: "existing",
  newOwnerFullName: "",
  newOwnerPhone: "",
  newOwnerEmail: "",
  newOwnerNotes: "",
  propertyId: "",
  propertyMode: "new",
  syncPropertyData: true,
  title: "",
  description: "",
  propertyType: "casa",
  locationText: "",
  street: "",
  streetNumber: "",
  city: "Paso de los Toros",
  department: "Tacuarembo",
  country: "Uruguay",
  bedrooms: "",
  bathrooms: "",
  areaM2: "",
  forSale: false,
  salePrice: "",
  saleCurrency: "USD",
  forRent: false,
  rentPrice: "",
  rentCurrency: "UYU",
  amenities: { ...EMPTY_AMENITIES },
  operations: ["alquiler"],
  status: "activo",
  slug: "",
  seoTitle: "",
  seoDescription: "",
  publicSummary: "",
  internalNotes: "",
  publishStatus: "publicado",
  visibility: "web",
  featuredOrder: "",
  homepageSection: "",
};

const EMPTY_OWNER_FORM: OwnerFormState = {
  id: null,
  fullName: "",
  phone: "",
  email: "",
  notes: "",
};

const EMPTY_PROPERTY_FORM: PropertyFormState = {
  id: "",
  title: "",
  description: "",
  propertyType: "casa",
  locationText: "",
  bedrooms: "",
  bathrooms: "",
  areaM2: "",
  status: "disponible",
  forSale: false,
  salePrice: "",
  saleCurrency: "USD",
  forRent: false,
  rentPrice: "",
  rentCurrency: "UYU",
  amenities: { ...EMPTY_AMENITIES },
};

const NAV_ITEMS: Array<{ id: PanelTab; label: string; hint: string }> = [
  { id: "resumen", label: "Dashboard", hint: "Estado operativo" },
  { id: "inmuebles", label: "Inmuebles", hint: "Stock interno" },
  { id: "propietarios", label: "Propietarios", hint: "Fichas y contacto" },
  { id: "publicaciones", label: "Publicaciones", hint: "Web y estados" },
  { id: "alquileres", label: "Alquileres", hint: "Contratos activos" },
];

const TAB_COPY: Record<PanelTab, { eyebrow: string; title: string; description: string }> = {
  resumen: {
    eyebrow: "Vista general",
    title: "Dashboard",
    description: "Lectura rápida de la salud de la web, stock, propietarios y alertas de publicación.",
  },
  publicaciones: {
    eyebrow: "Web publica",
    title: "Publicaciones",
    description: "Publica inmuebles ya cargados y administra su estado desde la planilla.",
  },
  inmuebles: {
    eyebrow: "Inventario interno",
    title: "Inmuebles",
    description: "Ficha madre: dirección, datos técnicos, propietario, imágenes y video.",
  },
  propietarios: {
    eyebrow: "Relación comercial",
    title: "Propietarios",
    description: "Administra fichas de contacto, notas y datos útiles de cada propietario.",
  },
  alquileres: {
    eyebrow: "Gestión mensual",
    title: "Alquileres activos",
    description: "Seguimiento de contratos vigentes, montos y fechas clave.",
  },
};

function matchesSearch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

function buildAddress(form: FormState): string {
  const streetLine = [form.street.trim(), form.streetNumber.trim()].filter(Boolean).join(" ");
  return [streetLine, form.city, form.department, form.country].filter(Boolean).join(", ");
}

function getAmenityFormValues(property?: AdminProperty | AdminListing["asespro_properties"] | null): Record<PropertyAmenityKey, boolean> {
  const source = (property ?? {}) as Record<string, unknown>;
  return PROPERTY_AMENITIES.reduce<Record<PropertyAmenityKey, boolean>>(
    (current, item) => ({
      ...current,
      [item.key]: source[item.dbKey] === true,
    }),
    { ...EMPTY_AMENITIES },
  );
}

function getAmenityPayload(amenities: Record<PropertyAmenityKey, boolean>): Record<string, boolean> {
  return PROPERTY_AMENITIES.reduce<Record<string, boolean>>((current, item) => {
    current[item.key] = amenities[item.key] === true;
    return current;
  }, {});
}

const PANEL_TABS: PanelTab[] = ["resumen", "inmuebles", "propietarios", "publicaciones", "alquileres"];

function getAvailableOperations(form: Pick<FormState, "forRent" | "forSale">): PropertyOperation[] {
  return [
    form.forRent ? "alquiler" : null,
    form.forSale ? "venta" : null,
  ].filter((operation): operation is PropertyOperation => operation !== null);
}

function ensureOperationForProperty(form: FormState): FormState {
  const available = getAvailableOperations(form);
  const selected = form.operations.find((operation) => available.includes(operation)) ?? available[0];
  return { ...form, operations: selected ? [selected] : [] };
}

function getPublicationOperations(form: FormState): PropertyOperation[] {
  const available = getAvailableOperations(form);
  const merged = [...available, ...form.operations];
  return merged.filter((operation, index) => merged.indexOf(operation) === index);
}

export function AdminPanel(): JSX.Element {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [supabasePublicUrl, setSupabasePublicUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [owners, setOwners] = useState<AdminOwner[]>([]);
  const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
  const [activeTab, setActiveTab] = useState<PanelTab>("resumen");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [wizardStep, setWizardStep] = useState<ListingWizardStep>("propietario");
  const [listingForm, setListingForm] = useState<FormState>(EMPTY_LISTING_FORM);
  const [ownerForm, setOwnerForm] = useState<OwnerFormState>(EMPTY_OWNER_FORM);
  const [propertyForm, setPropertyForm] = useState<PropertyFormState>(EMPTY_PROPERTY_FORM);
  const [propertyFormBaseline, setPropertyFormBaseline] = useState<PropertyFormState>(EMPTY_PROPERTY_FORM);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fileInputResetKey, setFileInputResetKey] = useState(0);
  const [videoUploadFeedback, setVideoUploadFeedback] = useState<string | null>(null);
  const [mediaUploadProgress, setMediaUploadProgress] = useState<MediaUploadProgress | null>(null);
  const [query, setQuery] = useState("");
  const [listingFilter, setListingFilter] = useState<ListingFilter>("todos");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const propertyHasPendingChanges = useMemo(() => {
    if (drawerMode !== "property") return false;
    return JSON.stringify(propertyForm) !== JSON.stringify(propertyFormBaseline);
  }, [drawerMode, propertyForm, propertyFormBaseline, photoFiles]);

  const activeListings = useMemo(() => listings.filter((listing) => listing.status === "activo"), [listings]);
  const inactiveProperties = useMemo(() => properties.filter((property) => !property.is_active), [properties]);
  const mediaIssues = useMemo(() => listings.filter(listingHasMediaIssue), [listings]);
  const pricedListings = useMemo(() => listings.filter((listing) => typeof listing.price_amount === "number"), [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const haystack = `${listing.title} ${listing.asespro_properties?.location_text ?? ""} ${listing.status} ${operationLabel(listing.asespro_listing_operations)}`;
      const searchOk = query.trim() ? matchesSearch(haystack, query) : true;
      const statusOk = listingFilter === "todos" ? true : listing.status === listingFilter;
      return searchOk && statusOk;
    });
  }, [listings, listingFilter, query]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const haystack = `${property.title} ${property.location_text ?? ""} ${property.property_type} ${property.is_active ? "activo" : "inactivo"}`;
      return query.trim() ? matchesSearch(haystack, query) : true;
    });
  }, [properties, query]);

  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => {
      const haystack = `${owner.full_name} ${owner.phone ?? ""} ${owner.email ?? ""} ${owner.notes ?? ""}`;
      return query.trim() ? matchesSearch(haystack, query) : true;
    });
  }, [owners, query]);

  useEffect(() => {
    fetch("/api/public/supabase-config")
      .then((response) => response.json())
      .then((config: { url?: string; anonKey?: string; error?: string }) => {
        const client = createSupabaseBrowserClient(config.url && config.anonKey ? { url: config.url, anonKey: config.anonKey } : null);
        if (!client) {
          setMessage(config.error ?? "Supabase publico no esta configurado.");
          return;
        }
        setSupabasePublicUrl(config.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
        setSupabase(client);
      })
      .catch(() => setMessage("No se pudo cargar la configuración de Supabase."));
  }, []);

  useEffect(() => {
    const storedTab = window.localStorage.getItem("asespro_admin_tab") as PanelTab | null;
    if (storedTab && PANEL_TABS.includes(storedTab)) {
      setActiveTab(storedTab);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("asespro_admin_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      setSessionEmail(data.session?.user.email ?? "");
      if (accessToken) void loadOverview(accessToken);
    });
  }, [supabase]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!drawerMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setDrawerMode(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerMode]);

  async function login(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!supabase) {
      setMessage("Supabase público no está configurado.");
      return;
    }

    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error || !data.session) {
      setMessage(error?.message ?? "No se pudo iniciar sesión.");
      return;
    }
    setToken(data.session.access_token);
    setSessionEmail(data.user?.email ?? email);
    await loadOverview(data.session.access_token);
  }

  async function logout(): Promise<void> {
    await supabase?.auth.signOut();
    setToken(null);
    setSessionEmail("");
    setListings([]);
    setProperties([]);
    setOwners([]);
    setActiveRentals([]);
  }

  async function loadOverview(accessToken = token): Promise<void> {
    if (!accessToken) return;
    const response = await fetch("/api/admin/overview", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = (await response.json()) as OverviewPayload;
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo cargar el panel.");
      return;
    }
    setListings(payload.listings ?? []);
    setProperties(payload.properties ?? []);
    setOwners(payload.owners ?? []);
    setActiveRentals(payload.activeRentals ?? []);
  }

  function selectTab(tab: PanelTab): void {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setQuery("");
    setListingFilter("todos");
  }

  function handleTouchStart(x: number): void {
    setTouchStartX(x);
    setTouchCurrentX(x);
  }

  function handleTouchMove(x: number): void {
    setTouchCurrentX(x);
  }

  function handleTouchEnd(): void {
    if (touchStartX === null || touchCurrentX === null) return;
    const delta = touchCurrentX - touchStartX;
    const openedFromEdge = touchStartX < 34;

    if (!mobileMenuOpen && openedFromEdge && delta > 42) {
      setMobileMenuOpen(true);
    }

    if (mobileMenuOpen && delta < -42) {
      setMobileMenuOpen(false);
    }

    setTouchStartX(null);
    setTouchCurrentX(null);
  }

  function openListingFormFrom(tab: PanelTab, step: ListingWizardStep): void {
    setListingForm(EMPTY_LISTING_FORM);
    setWizardStep(step);
    setPhotoFiles([]);
    setCoverPhotoIndex(0);
    setVideoUploadFeedback(null);
    setMediaUploadProgress(null);
    setDrawerMode("listing");
    setActiveTab(tab);
    setMessage(null);
  }

  function openNewListingForm(): void {
    openListingFormFrom("publicaciones", "publicacion");
  }

  function openNewPropertyForm(): void {
    openListingFormFrom("inmuebles", "propietario");
  }

  function openNewOwnerForm(): void {
    setOwnerForm(EMPTY_OWNER_FORM);
    setDrawerMode("owner");
    setActiveTab("propietarios");
    setMessage(null);
  }

  function toggleOperation(operation: PropertyOperation): void {
    setListingForm((current) => {
      const available = getPublicationOperations(current);
      if (!available.includes(operation)) return current;
      return { ...current, operations: [operation] };
    });
  }

  function selectPropertyForListing(propertyId: string): void {
    const property = properties.find((item) => item.id === propertyId);
    if (!property) {
      setListingForm((current) => ({ ...current, propertyId }));
      return;
    }

    setListingForm((current) =>
      ensureOperationForProperty({
        ...current,
        propertyId,
        ownerId: property.asespro_property_owners?.[0]?.owner_id ?? current.ownerId,
        title: property.title,
        description: property.description || "",
        propertyType: property.property_type,
        locationText: property.location_text ?? "",
        street: current.street,
        streetNumber: current.streetNumber,
        city: current.city,
        department: current.department,
        country: current.country,
        bedrooms: property.bedrooms?.toString() ?? "",
        bathrooms: property.bathrooms?.toString() ?? "",
        areaM2: property.area_m2?.toString() ?? "",
        forSale: property.for_sale === true,
        salePrice: property.sale_price?.toString() ?? "",
        saleCurrency: property.sale_currency ?? "USD",
        forRent: property.for_rent === true,
        rentPrice: property.rent_price?.toString() ?? "",
        rentCurrency: property.rent_currency ?? "UYU",
        amenities: getAmenityFormValues(property),
      }),
    );
  }

  function editListing(listing: AdminListing): void {
    const operations = listing.asespro_listing_operations.map((item) => item.operation);
    const linkedProperty = properties.find((property) => property.id === listing.property_id);
    setListingForm({
      id: listing.id,
      isFeatured: listing.is_featured === true,
      ownerId: linkedProperty?.asespro_property_owners?.[0]?.owner_id ?? "",
      ownerMode: "existing",
      newOwnerFullName: "",
      newOwnerPhone: "",
      newOwnerEmail: "",
      newOwnerNotes: "",
      propertyId: listing.property_id,
      propertyMode: "existing",
      syncPropertyData: true,
      title: listing.title,
      description: listing.description ?? "",
      propertyType: listing.asespro_properties?.property_type ?? "casa",
      locationText: listing.asespro_properties?.location_text ?? "",
      street: "",
      streetNumber: "",
      city: "Paso de los Toros",
      department: "Tacuarembo",
      country: "Uruguay",
      bedrooms: listing.asespro_properties?.bedrooms?.toString() ?? "",
      bathrooms: listing.asespro_properties?.bathrooms?.toString() ?? "",
      areaM2: listing.asespro_properties?.area_m2?.toString() ?? "",
      forSale: listing.asespro_properties?.for_sale === true || operations.includes("venta"),
      salePrice: listing.asespro_properties?.sale_price?.toString() ?? (operations.includes("venta") ? listing.price_amount?.toString() ?? "" : ""),
      saleCurrency: listing.asespro_properties?.sale_currency ?? (operations.includes("venta") ? listing.price_currency ?? "USD" : "USD"),
      forRent: listing.asespro_properties?.for_rent === true || operations.includes("alquiler"),
      rentPrice: listing.asespro_properties?.rent_price?.toString() ?? (operations.includes("alquiler") ? listing.price_amount?.toString() ?? "" : ""),
      rentCurrency: listing.asespro_properties?.rent_currency ?? (operations.includes("alquiler") ? listing.price_currency ?? "UYU" : "UYU"),
      amenities: getAmenityFormValues(listing.asespro_properties),
      operations: operations.length > 0 ? operations : ["alquiler"],
      status: listing.status,
      slug: listing.slug ?? "",
      seoTitle: listing.seo_title ?? "",
      seoDescription: listing.seo_description ?? "",
      publicSummary: listing.public_summary ?? "",
      internalNotes: listing.internal_notes ?? "",
      publishStatus: listing.publish_status ?? (listing.status === "activo" ? "publicado" : "pausado"),
      visibility: listing.visibility ?? "web",
      featuredOrder: listing.featured_order?.toString() ?? "",
      homepageSection: listing.homepage_section ?? "",
    });
    setDrawerMode("publication");
    setActiveTab("publicaciones");
    setMessage("Editando publicación existente.");
  }

  function editOwner(owner: AdminOwner): void {
    setOwnerForm({
      id: owner.id,
      fullName: owner.full_name,
      phone: owner.phone ?? "",
      email: owner.email ?? "",
      notes: owner.notes ?? "",
    });
    setDrawerMode("owner");
    setActiveTab("propietarios");
    setMessage("Editando propietario.");
  }

  function editProperty(property: AdminProperty): void {
    setPhotoFiles([]);
    setCoverPhotoIndex(0);
    setVideoUploadFeedback(null);
    setMediaUploadProgress(null);
    const nextForm = {
      id: property.id,
      title: property.title,
      description: property.description ?? "",
      propertyType: property.property_type,
      locationText: property.location_text ?? "",
      bedrooms: property.bedrooms?.toString() ?? "",
      bathrooms: property.bathrooms?.toString() ?? "",
      areaM2: property.area_m2?.toString() ?? "",
      status: property.status ?? "disponible",
      forSale: property.for_sale === true,
      salePrice: property.sale_price?.toString() ?? "",
      saleCurrency: property.sale_currency ?? "USD",
      forRent: property.for_rent === true,
      rentPrice: property.rent_price?.toString() ?? "",
      rentCurrency: property.rent_currency ?? "UYU",
      amenities: getAmenityFormValues(property),
    };
    setPropertyForm(nextForm);
    setPropertyFormBaseline(nextForm);
    setDrawerMode("property");
    setActiveTab("inmuebles");
    setMessage("Editando inmueble.");
  }

  async function saveListing(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setMessage(null);

    if (listingForm.ownerMode === "existing" && !listingForm.ownerId) {
      setBusy(false);
      setWizardStep("propietario");
      setMessage("Selecciona un propietario o crea uno nuevo.");
      return;
    }

    if (listingForm.propertyMode === "existing" && !listingForm.propertyId) {
      setBusy(false);
      setWizardStep("inmueble");
      setMessage("Selecciona un inmueble o crea uno nuevo.");
      return;
    }

    let ownerId = listingForm.ownerMode === "existing" ? listingForm.ownerId : "";
    if (listingForm.ownerMode === "new") {
      const ownerResponse = await fetch("/api/admin/owners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: listingForm.newOwnerFullName,
          phone: listingForm.newOwnerPhone,
          email: listingForm.newOwnerEmail,
          notes: listingForm.newOwnerNotes,
        }),
      });
      const ownerPayload = (await ownerResponse.json()) as { id?: string; error?: string };
      if (!ownerResponse.ok || !ownerPayload.id) {
        setBusy(false);
        setWizardStep("propietario");
        setMessage(ownerPayload.error ?? "No se pudo crear el propietario.");
        return;
      }
      ownerId = ownerPayload.id;
    }

    const body = {
      isFeatured: listingForm.isFeatured,
      ownerId: ownerId || undefined,
      propertyId: listingForm.propertyMode === "existing" ? listingForm.propertyId : undefined,
      syncPropertyData: listingForm.syncPropertyData,
      title: listingForm.title || buildAddress(listingForm),
      description: listingForm.description,
      propertyType: listingForm.propertyType,
      locationText: listingForm.propertyMode === "existing" ? listingForm.locationText : buildAddress(listingForm),
      latitude: "",
      longitude: "",
      bedrooms: listingForm.bedrooms,
      bathrooms: listingForm.bathrooms,
      areaM2: listingForm.areaM2,
      forSale: listingForm.forSale,
      salePrice: listingForm.salePrice,
      saleCurrency: listingForm.saleCurrency,
      forRent: listingForm.forRent,
      rentPrice: listingForm.rentPrice,
      rentCurrency: listingForm.rentCurrency,
      amenities: getAmenityPayload(listingForm.amenities),
      operations: listingForm.operations,
      status: listingForm.status,
    };
    const response = await fetch(listingForm.id ? `/api/admin/listings/${listingForm.id}` : "/api/admin/listings", {
      method: listingForm.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { id?: string; propertyId?: string; error?: string };

    if (!response.ok || !payload.id) {
      setBusy(false);
      setMessage(payload.error ?? "No se pudo guardar.");
      return;
    }

    try {
      await uploadPropertyMedia(payload.propertyId ?? listingForm.propertyId);
    } catch (error) {
      setBusy(false);
      setMediaUploadProgress(null);
      setMessage(error instanceof Error ? error.message : "La publicación se guardó, pero falló la carga de media.");
      return;
    }
    setListingForm(EMPTY_LISTING_FORM);
    setPhotoFiles([]);
    setCoverPhotoIndex(0);
    setVideoFile(null);
    setVideoUploadFeedback(null);
    setFileInputResetKey((key) => key + 1);
    setMediaUploadProgress(null);
    setDrawerMode(null);
    await loadOverview(token);
    setBusy(false);
    setMessage("Publicación guardada.");
  }

  async function saveOwner(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setMessage(null);

    const response = await fetch(ownerForm.id ? `/api/admin/owners/${ownerForm.id}` : "/api/admin/owners", {
      method: ownerForm.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ownerForm),
    });
    const payload = (await response.json()) as { id?: string; error?: string };
    if (!response.ok || !payload.id) {
      setBusy(false);
      setMessage(payload.error ?? "No se pudo guardar el propietario.");
      return;
    }

    setOwnerForm(EMPTY_OWNER_FORM);
    setDrawerMode(null);
    await loadOverview(token);
    setBusy(false);
    setMessage("Propietario guardado.");
  }

  async function savePublication(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !listingForm.id) return;
    setBusy(true);
    setMessage(null);

    const response = await fetch(`/api/admin/listings/${listingForm.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: listingForm.status,
        operations: listingForm.operations,
        isFeatured: listingForm.isFeatured,
        title: listingForm.title,
        description: listingForm.description,
        slug: listingForm.slug,
        seoTitle: listingForm.seoTitle,
        seoDescription: listingForm.seoDescription,
        publicSummary: listingForm.publicSummary,
        internalNotes: listingForm.internalNotes,
        publishStatus: listingForm.publishStatus,
        visibility: listingForm.visibility,
        featuredOrder: listingForm.featuredOrder,
        homepageSection: listingForm.homepageSection,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setBusy(false);
      setMessage(payload.error ?? "No se pudo guardar la publicación.");
      return;
    }

    setListingForm(EMPTY_LISTING_FORM);
    setDrawerMode(null);
    await loadOverview(token);
    setBusy(false);
    setMessage("Publicación actualizada.");
  }

  async function saveProperty(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !propertyForm.id) return;
    setBusy(true);
    setMediaUploadProgress(null);
    setMessage(null);

    const original = properties.find((property) => property.id === propertyForm.id);
    const priceChanged =
      (original?.sale_price?.toString() ?? "") !== propertyForm.salePrice ||
      (original?.sale_currency ?? "USD") !== propertyForm.saleCurrency ||
      (original?.rent_price?.toString() ?? "") !== propertyForm.rentPrice ||
      (original?.rent_currency ?? "UYU") !== propertyForm.rentCurrency;

    const response = await fetch(`/api/admin/properties/${propertyForm.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(propertyForm),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setBusy(false);
      setMediaUploadProgress(null);
      setMessage(payload.error ?? "No se pudo actualizar el inmueble.");
      return;
    }

    setPropertyForm(EMPTY_PROPERTY_FORM);
    setPropertyFormBaseline(EMPTY_PROPERTY_FORM);
    setPhotoFiles([]);
    setCoverPhotoIndex(0);
    setMediaUploadProgress(null);
    setDrawerMode(null);
    await loadOverview(token);
    setBusy(false);
    setMessage(priceChanged ? "Inmueble actualizado. Revisa Publicaciones para confirmar el precio publicado." : "Inmueble actualizado y sincronizado con sus publicaciones.");
  }

  async function deletePropertyMedia(propertyId: string, mediaId: string): Promise<void> {
    if (!token || !propertyId || !mediaId) return;
    setBusy(true);
    setMessage(null);

    const response = await fetch(`/api/admin/properties/${propertyId}/media/${mediaId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setBusy(false);
      setMessage(payload?.error ?? "No se pudo eliminar el archivo.");
      return;
    }

    await loadOverview(token);
    setBusy(false);
    setMessage("Archivo eliminado.");
  }

  async function reorderPropertyMedia(propertyId: string, mediaType: "photo" | "video", orderedItems: AdminMedia[]): Promise<void> {
    if (!token || !propertyId || orderedItems.length === 0) return;
    setBusy(true);
    setMessage(null);

    const body = {
      mediaType,
      items: orderedItems.map((item, index) => ({
        id: item.id,
        sortOrder: index,
        isCover: mediaType === "photo" ? index === 0 : false,
        isVisible: item.is_visible !== false,
        focalX: item.focal_x ?? 50,
        focalY: item.focal_y ?? 50,
      })),
    };

    const response = await fetch(`/api/admin/properties/${propertyId}/media`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setBusy(false);
      setMessage(payload?.error ?? "No se pudo reordenar los archivos.");
      return;
    }

    await loadOverview(token);
    setBusy(false);
    setMessage("Orden de archivos actualizado.");
  }

  async function savePropertyMediaDraft(propertyId: string, mediaItems: AdminMedia[]): Promise<void> {
    if (!token || !propertyId) return;
    const photoItems = mediaItems.filter((item) => item.media_type === "photo");
    const videoItems = mediaItems.filter((item) => item.media_type === "video");
    const groups: Array<{ mediaType: "photo" | "video"; items: AdminMedia[] }> = [
      { mediaType: "photo" as const, items: photoItems },
      { mediaType: "video" as const, items: videoItems },
    ].filter((group): group is { mediaType: "photo" | "video"; items: AdminMedia[] } => group.items.length > 0);
    if (groups.length === 0) return;

    setBusy(true);
    setMessage(null);
    for (const group of groups) {
      const response = await fetch(`/api/admin/properties/${propertyId}/media`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mediaType: group.mediaType,
          items: group.items.map((item, index) => ({
            id: item.id,
            sortOrder: index,
            isCover: group.mediaType === "photo" ? index === 0 : false,
            isVisible: item.is_visible !== false,
            focalX: item.focal_x ?? 50,
            focalY: item.focal_y ?? 50,
            altText: item.alt_text ?? "",
            caption: item.caption ?? "",
            qualityStatus: item.quality_status ?? "pendiente",
          })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setBusy(false);
        setMessage(payload?.error ?? "No se pudo guardar la multimedia.");
        return;
      }
    }

    await loadOverview(token);
    setBusy(false);
    setMessage("Multimedia guardada.");
  }

  async function updateListingStatus(listing: AdminListing, status: PropertyStatus): Promise<void> {
    if (!token) return;
    setBusy(true);
    const response = await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo cambiar el estado.");
    } else {
      await loadOverview(token);
    }
    setBusy(false);
  }

  async function updateListingFeatured(listing: AdminListing, isFeatured: boolean): Promise<void> {
    if (!token) return;
    setBusy(true);
    const response = await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isFeatured }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo actualizar el destacado.");
    } else {
      await loadOverview(token);
    }
    setBusy(false);
  }

  async function updatePropertyActive(property: AdminProperty, isActive: boolean): Promise<void> {
    if (!token) return;
    setBusy(true);
    const response = await fetch(`/api/admin/properties/${property.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudo actualizar el inmueble.");
    } else {
      await loadOverview(token);
    }
    setBusy(false);
  }

  async function uploadPropertyMedia(propertyId: string): Promise<void> {
    if (!token || !propertyId) return;
    await uploadPropertyPhotos(propertyId);
    await uploadPropertyVideo(propertyId);
  }

  async function uploadPropertyPhotos(propertyId: string): Promise<void> {
    if (!token || !propertyId) return;
    for (const [index, file] of photoFiles.entries()) {
      const data = new FormData();
      data.set("file", file);
      data.set("mediaType", "photo");
      data.set("isCover", index === coverPhotoIndex ? "true" : "false");
      data.set("replaceGroup", "false");
      const payload = await uploadMediaRequest(`/api/admin/properties/${propertyId}/media`, data, token, `Subiendo imagen ${index + 1} de ${photoFiles.length}`);
      if (payload.media?.media_type !== "photo") {
        throw new Error(`La imagen ${file.name} subio, pero no quedo registrada como foto.`);
      }
    }
  }

  function applyUploadedPropertyVideo(propertyId: string, media: AdminMedia): void {
    const replaceVideo = (items: AdminMedia[] | undefined): AdminMedia[] => [
      ...(items ?? []).filter((item) => item.media_type !== "video"),
      media,
    ];
    setProperties((current) =>
      current.map((property) =>
        property.id === propertyId
          ? { ...property, asespro_property_media: replaceVideo(property.asespro_property_media) }
          : property,
      ),
    );
    setListings((current) =>
      current.map((listing) =>
        listing.property_id === propertyId && listing.asespro_properties
          ? {
              ...listing,
              asespro_properties: {
                ...listing.asespro_properties,
                asespro_property_media: replaceVideo(listing.asespro_properties.asespro_property_media),
              },
            }
          : listing,
      ),
    );
  }

  async function uploadPropertyVideo(propertyId: string): Promise<AdminMedia | null> {
    if (!token || !propertyId || !videoFile) return null;
    await validateVideoForUpload(videoFile);
    const payload = await uploadChunkedPropertyVideo(propertyId, videoFile, token);
    if (payload.media?.media_type !== "video") {
      throw new Error(payload.error ?? `El video ${videoFile.name} no se pudo registrar en la ficha.`);
    }
    applyUploadedPropertyVideo(propertyId, payload.media);
    setMediaUploadProgress({ label: `Subiendo video ${videoFile.name}`, percent: 100 });
    setMessage("Video cargado y registrado correctamente.");
    return payload.media;
  }

  function validateVideoForUpload(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(".mp4") || (file.type && file.type !== REQUIRED_VIDEO_MIME)) {
        reject(new Error("El video debe ser un archivo MP4. Formato esperado: 9:16 en MP4 H.264/AAC."));
        return;
      }

      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        reject(new Error(`El video supera el limite de ${MAX_VIDEO_SIZE_LABEL}.`));
        return;
      }

      const probe = document.createElement("video");
      const canPlayRequiredMp4 = probe.canPlayType(REQUIRED_VIDEO_CODECS);
      if (!canPlayRequiredMp4) {
        reject(new Error("Este navegador no puede validar/reproducir MP4 H.264/AAC. Prueba desde Chrome o Edge actualizado."));
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const cleanup = () => {
        probe.removeAttribute("src");
        URL.revokeObjectURL(objectUrl);
      };
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("No se pudo validar el video. Verifica que sea MP4 H.264/AAC y vuelve a intentar."));
      }, 15000);

      probe.preload = "metadata";
      probe.muted = true;
      probe.playsInline = true;
      probe.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        const ratio = probe.videoWidth > 0 && probe.videoHeight > 0 ? probe.videoWidth / probe.videoHeight : 0;
        cleanup();

        if (!probe.videoWidth || !probe.videoHeight) {
          reject(new Error("No se pudieron leer las dimensiones del video."));
          return;
        }

        if (ratio < 0.48 || ratio > 0.64) {
          reject(new Error(`El video debe estar en formato vertical 9:16. Detectado: ${probe.videoWidth}x${probe.videoHeight}.`));
          return;
        }

        resolve();
      };
      probe.onerror = () => {
        window.clearTimeout(timeout);
        cleanup();
        reject(new Error("El video no es compatible para web. Usa MP4 con video H.264 y audio AAC."));
      };
      probe.src = objectUrl;
    });
  }

  async function uploadChunkedPropertyVideo(propertyId: string, file: File, accessToken: string): Promise<MediaUploadResponse> {
    const endpoint = `/api/admin/properties/${propertyId}/media`;
    const initData = new FormData();
    initData.set("intent", "chunkedUploadInit");
    initData.set("mediaType", "video");
    initData.set("fileName", file.name);
    initData.set("fileSize", String(file.size));
    initData.set("contentType", file.type || REQUIRED_VIDEO_MIME);

    setMediaUploadProgress({ label: "Preparando carga de video...", percent: 1 });
    const initResponse = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: initData,
    });
    const initText = await initResponse.text();
    const initPayload = ((): ChunkedUploadInitResponse | null => {
      try {
        return initText ? (JSON.parse(initText) as ChunkedUploadInitResponse) : null;
      } catch {
        return null;
      }
    })();
    if (!initResponse.ok || !initPayload?.uploadId) {
      throw new Error(initPayload?.error ?? `No se pudo preparar la carga del video (HTTP ${initResponse.status}).`);
    }

    const chunkSize = initPayload.chunkSize && initPayload.chunkSize > 0 ? initPayload.chunkSize : RESUMABLE_VIDEO_CHUNK_BYTES;
    const totalChunks = Math.ceil(file.size / chunkSize);
    for (let index = 0; index < totalChunks; index += 1) {
      const start = index * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      await uploadVideoChunk({
        endpoint,
        accessToken,
        uploadId: initPayload.uploadId,
        chunk: file.slice(start, end),
        chunkIndex: index,
        totalChunks,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || REQUIRED_VIDEO_MIME,
      });
    }

    setMediaUploadProgress({ label: "Registrando video en la ficha...", percent: 99 });
    const completeData = new FormData();
    completeData.set("intent", "chunkedUploadComplete");
    completeData.set("mediaType", "video");
    completeData.set("uploadId", initPayload.uploadId);
    completeData.set("fileName", file.name);
    completeData.set("fileSize", String(file.size));
    completeData.set("contentType", file.type || REQUIRED_VIDEO_MIME);
    completeData.set("totalChunks", String(totalChunks));
    completeData.set("replaceGroup", "true");

    const completeResponse = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: completeData,
    });
    const completeText = await completeResponse.text();
    const completePayload = ((): MediaUploadResponse | null => {
      try {
        return completeText ? (JSON.parse(completeText) as MediaUploadResponse) : null;
      } catch {
        return null;
      }
    })();
    if (!completeResponse.ok || completePayload?.media?.media_type !== "video") {
      throw new Error(completePayload?.error ?? `El video no se pudo finalizar (HTTP ${completeResponse.status}).`);
    }
    return completePayload;
  }

  function uploadVideoChunk({
    endpoint,
    accessToken,
    uploadId,
    chunk,
    chunkIndex,
    totalChunks,
    fileName,
    fileSize,
    contentType,
  }: {
    endpoint: string;
    accessToken: string;
    uploadId: string;
    chunk: Blob;
    chunkIndex: number;
    totalChunks: number;
    fileName: string;
    fileSize: number;
    contentType: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const body = new FormData();
      body.set("intent", "chunkedUploadPart");
      body.set("mediaType", "video");
      body.set("uploadId", uploadId);
      body.set("chunkIndex", String(chunkIndex));
      body.set("totalChunks", String(totalChunks));
      body.set("fileName", fileName);
      body.set("fileSize", String(fileSize));
      body.set("contentType", contentType);
      body.set("chunk", chunk, `${fileName}.part-${chunkIndex}`);

      const request = new XMLHttpRequest();
      request.open("POST", endpoint, true);
      request.timeout = 1000 * 60 * 10;
      request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const loaded = chunkIndex + event.loaded / event.total;
        const percent = Math.max(1, Math.min(97, Math.round((loaded / totalChunks) * 97)));
        setMediaUploadProgress({ label: `Subiendo video ${chunkIndex + 1} de ${totalChunks}`, percent });
      };
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          resolve();
          return;
        }
        let errorMessage = `No se pudo subir la parte ${chunkIndex + 1} del video (${request.status}).`;
        try {
          const payload = JSON.parse(request.responseText) as { error?: string };
          if (payload.error) errorMessage = payload.error;
        } catch {
          if (request.responseText) errorMessage = request.responseText;
        }
        reject(new Error(errorMessage));
      };
      request.onerror = () => reject(new Error(`Error de red al subir la parte ${chunkIndex + 1} del video.`));
      request.ontimeout = () => reject(new Error(`La parte ${chunkIndex + 1} del video excedio el tiempo limite.`));
      request.send(body);
    });
  }

  function getSupabaseResumableEndpoint(): string {
    if (!supabasePublicUrl) {
      throw new Error("No se pudo resolver el endpoint de Storage para subir el video.");
    }

    const trimmed = supabasePublicUrl.replace(/\/+$/, "");
    try {
      const url = new URL(trimmed);
      if (url.hostname.endsWith(".supabase.co")) {
        url.hostname = url.hostname.replace(/\.supabase\.co$/, ".storage.supabase.co");
      }
      url.pathname = "/storage/v1/upload/resumable";
      return url.toString();
    } catch {
      return `${trimmed}/storage/v1/upload/resumable`;
    }
  }

  function encodeTusMetadataValue(value: string): string {
    try {
      return btoa(unescape(encodeURIComponent(value)));
    } catch {
      return btoa(value);
    }
  }

  function buildTusMetadata(storagePath: string): string {
    return [
      `bucketName ${encodeTusMetadataValue("asespro-media")}`,
      `objectName ${encodeTusMetadataValue(storagePath)}`,
      `contentType ${encodeTusMetadataValue(REQUIRED_VIDEO_MIME)}`,
      `cacheControl ${encodeTusMetadataValue("3600")}`,
    ].join(",");
  }

  async function uploadPropertyVideoResumable({
    file,
    accessToken,
    storagePath,
    signedToken,
  }: {
    file: File;
    accessToken: string;
    storagePath: string;
    signedToken: string;
  }): Promise<void> {
    const endpoint = getSupabaseResumableEndpoint();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const authToken = anonKey || accessToken;
    const firstChunk = file.slice(0, Math.min(file.size, RESUMABLE_VIDEO_CHUNK_BYTES));
    const createHeaders = new Headers({
      authorization: `Bearer ${authToken}`,
      "x-upsert": "true",
      "x-signature": signedToken,
      "tus-resumable": "1.0.0",
      "upload-length": String(file.size),
      "upload-metadata": buildTusMetadata(storagePath),
      "content-type": "application/offset+octet-stream",
    });
    if (anonKey) createHeaders.set("apikey", anonKey);

    const createResponse = await fetch(endpoint, {
      method: "POST",
      headers: createHeaders,
      body: firstChunk,
    });
    if (!createResponse.ok) {
      const detail = await createResponse.text();
      throw new Error(`No se pudo iniciar la carga resumable (${createResponse.status}). ${detail || "Sin detalle."}`);
    }

    const locationHeader = createResponse.headers.get("location") ?? createResponse.headers.get("Location");
    if (!locationHeader) {
      throw new Error("Storage no devolvio una URL de carga resumable.");
    }
    const uploadUrl = new URL(locationHeader, endpoint).toString();

    const initialOffset = Number(createResponse.headers.get("upload-offset") ?? createResponse.headers.get("Upload-Offset"));
    let offset = Number.isFinite(initialOffset) && initialOffset > 0 ? initialOffset : firstChunk.size;
    const initialPercent = file.size > 0 ? Math.max(1, Math.min(97, Math.round((offset / file.size) * 97))) : 1;
    setMediaUploadProgress({ label: "Subiendo video...", percent: initialPercent });

    while (offset < file.size) {
      const chunk = file.slice(offset, Math.min(file.size, offset + RESUMABLE_VIDEO_CHUNK_BYTES));
      const patchHeaders = new Headers({
        authorization: `Bearer ${authToken}`,
        "x-signature": signedToken,
        "tus-resumable": "1.0.0",
        "upload-offset": String(offset),
        "content-type": "application/offset+octet-stream",
      });
      if (anonKey) patchHeaders.set("apikey", anonKey);

      const patchResponse = await fetch(uploadUrl, {
        method: "PATCH",
        headers: patchHeaders,
        body: chunk,
      });
      if (!patchResponse.ok) {
        const detail = await patchResponse.text();
        throw new Error(`Storage rechazó una parte del video (${patchResponse.status}). ${detail || "Sin detalle."}`);
      }

      const headerOffset = Number(patchResponse.headers.get("upload-offset") ?? patchResponse.headers.get("Upload-Offset"));
      offset = Number.isFinite(headerOffset) && headerOffset > offset ? headerOffset : offset + chunk.size;
      const percent = file.size > 0 ? Math.max(1, Math.min(97, Math.round((offset / file.size) * 97))) : 1;
      setMediaUploadProgress({ label: "Subiendo video...", percent });
    }
  }

  async function uploadSelectedPropertyPhotos(): Promise<void> {
    if (!token || !propertyForm.id || photoFiles.length === 0) return;
    setBusy(true);
    setMessage(null);
    setMediaUploadProgress(null);

    try {
      await uploadPropertyPhotos(propertyForm.id);
      setPhotoFiles([]);
      setCoverPhotoIndex(0);
      setMediaUploadProgress(null);
      await loadOverview(token);
      setMessage("Imágenes cargadas y agregadas al inmueble.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar las imágenes.");
      setMediaUploadProgress(null);
    } finally {
      setBusy(false);
    }
  }

  async function uploadSelectedPropertyVideoFile(): Promise<void> {
    if (!token || !propertyForm.id || !videoFile) return;
    setBusy(true);
    setMessage(null);
    setVideoUploadFeedback("Subiendo video...");
    setMediaUploadProgress(null);

    try {
      await uploadPropertyVideo(propertyForm.id);
      setVideoFile(null);
      setVideoUploadFeedback("Video cargado y registrado correctamente.");
      setFileInputResetKey((key) => key + 1);
      setMediaUploadProgress(null);
      await loadOverview(token);
      setMessage("Video cargado y registrado correctamente.");
    } catch (error) {
      const detail = error instanceof Error && error.message.trim().length > 0 ? error.message : "No se pudo cargar el video.";
      setMessage(detail);
      setVideoUploadFeedback(`Error al cargar video: ${detail}`);
      setVideoFile(null);
      setMediaUploadProgress({ label: `Error al cargar video: ${detail}`, percent: 1 });
      setFileInputResetKey((key) => key + 1);
    } finally {
      setBusy(false);
    }
  }

  function uploadMediaRequest(url: string, data: FormData, accessToken: string, label: string): Promise<MediaUploadResponse> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      setMediaUploadProgress({ label, percent: 0 });
      const isVideoUpload = label.toLowerCase().includes("video");

      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          setMediaUploadProgress({ label, percent: 0 });
          return;
        }
        setMediaUploadProgress({ label, percent: Math.min(99, Math.round((event.loaded / event.total) * 100)) });
      };
      request.upload.onload = () => {
        if (isVideoUpload) {
          setMediaUploadProgress({ label: "Procesando video en servidor...", percent: 99 });
        }
      };

      request.onload = () => {
        let payload: MediaUploadResponse | null = null;
        try {
          payload = request.responseText ? (JSON.parse(request.responseText) as { error?: string }) : null;
        } catch {
          payload = null;
        }

        if (request.status >= 200 && request.status < 300) {
          setMediaUploadProgress({ label, percent: 100 });
          resolve(payload ?? {});
          return;
        }

        reject(new Error(payload?.error ?? `No se pudo completar la carga (${request.status}).`));
      };

      request.onerror = () => reject(new Error("No se pudo conectar con el servidor durante la carga."));
      request.onabort = () => reject(new Error("La carga fue cancelada."));
      request.ontimeout = () => reject(new Error("La carga demoró demasiado. Intenta con un video más liviano o reintenta."));
      request.timeout = isVideoUpload ? 30 * 60 * 1000 : 10 * 60 * 1000;
      request.open("POST", url);
      request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      request.send(data);
    });
  }

  if (!token) {
    return (
      <main className={styles.loginShell} data-admin-shell="true">
        <section className={styles.loginCard}>
          <div className={styles.loginLogoWrap}>
            <img src="/LOGO_ASESPRO_transparente_horizontal.png?v=20260429b" alt="ASESPRO" className={styles.logoDesktop} />
            <img src="/LOGO_ASESPRO_transparente_horizontal_moible.png?v=20260429b" alt="ASESPRO" className={styles.logoMobile} />
          </div>
          <span className={styles.adminMark}>Backoffice inmobiliario</span>
          <h1>Panel interno</h1>
          <p>Gestiona publicaciones, stock, propietarios y alquileres desde un solo lugar.</p>
          <form className={styles.loginForm} onSubmit={login}>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Contraseña
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {message ? <p className={styles.alert}>{message}</p> : null}
            <button type="submit" disabled={busy}>
              {busy ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const title = NAV_ITEMS.find((item) => item.id === activeTab)?.label ?? "Panel";
  const tabCopy = TAB_COPY[activeTab];

  return (
    <main
      className={styles.appShell}
      data-admin-shell="true"
      onTouchStart={(event) => handleTouchStart(event.touches[0]?.clientX ?? 0)}
      onTouchMove={(event) => handleTouchMove(event.touches[0]?.clientX ?? 0)}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        className={`${styles.mobileScrim} ${mobileMenuOpen ? styles.mobileScrimOpen : ""}`}
        aria-label="Cerrar menú"
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
        <div>
          <div className={styles.sidebarLogoWrap}>
            <img src="/LOGO_ASESPRO_transparente_horizontal.png?v=20260429b" alt="ASESPRO" className={styles.logoDesktop} />
            <img src="/LOGO_ASESPRO_transparente_horizontal_moible.png?v=20260429b" alt="ASESPRO" className={styles.logoMobile} />
          </div>
          <div className={styles.accountCard}>
            <span>Sesión activa</span>
            <strong>{sessionEmail || "Admin"}</strong>
          </div>
        </div>
        <nav className={styles.sideNav} aria-label="Secciones del panel">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={activeTab === item.id ? styles.activeNav : ""} type="button" onClick={() => selectTab(item.id)}>
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
        </nav>
        <button type="button" className={styles.secondaryButton} onClick={logout}>
          Salir
        </button>
      </aside>

      <section className={styles.workspace}>
        <div className={styles.mobileAdminBar}>
          <div className={styles.mobileBrand}>
            <img src="/LOGO_ASESPRO_transparente_horizontal_moible.png?v=20260429b" alt="ASESPRO" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            className={styles.hamburgerButton}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <header className={styles.topBar}>
          <div>
            <p className={styles.kicker}>{tabCopy.eyebrow}</p>
            <h2>{tabCopy.title}</h2>
            <span>{tabCopy.description}</span>
          </div>
          <TabActions
            activeTab={activeTab}
            onRefresh={() => void loadOverview()}
            onNewListing={openNewListingForm}
            onNewProperty={openNewPropertyForm}
            onNewOwner={openNewOwnerForm}
            onSelectTab={selectTab}
          />
        </header>

        {message ? <p className={styles.notice}>{message}</p> : null}

        {drawerMode === "listing" ? (
          <Modal onClose={() => setDrawerMode(null)}>
            <ListingDrawer
              form={listingForm}
              owners={owners}
              properties={properties}
              step={wizardStep}
              busy={busy}
              onClose={() => setDrawerMode(null)}
              onSubmit={saveListing}
              onChange={setListingForm}
              onStepChange={setWizardStep}
              onSelectProperty={selectPropertyForListing}
              onToggleOperation={toggleOperation}
              photoFiles={photoFiles}
              mediaUploadProgress={mediaUploadProgress}
              coverPhotoIndex={coverPhotoIndex}
              fileInputResetKey={fileInputResetKey}
              onPhotosChange={(files) => {
                setPhotoFiles(files);
                setCoverPhotoIndex(0);
                setMediaUploadProgress(null);
              }}
              onCoverPhotoChange={setCoverPhotoIndex}
              onVideoChange={(file) => {
                setMediaUploadProgress(null);
                setMessage(null);
                setVideoUploadFeedback(null);
                if (!file) {
                  setVideoFile(null);
                  return;
                }
                void validateVideoForUpload(file)
                  .then(() => {
                    setVideoFile(file);
                    setVideoUploadFeedback(`Video listo para subir: ${file.name} (${Math.round(file.size / 1024 / 1024)} MB).`);
                    setMessage(`Video listo para subir: ${file.name} (${Math.round(file.size / 1024 / 1024)} MB).`);
                  })
                  .catch((error) => {
                    setVideoFile(null);
                    setVideoUploadFeedback(error instanceof Error ? error.message : "El video seleccionado no es compatible.");
                    setMessage(error instanceof Error ? error.message : "El video seleccionado no es compatible.");
                  });
              }}
            />
          </Modal>
        ) : null}

        {drawerMode === "publication" ? (
          <Modal onClose={() => setDrawerMode(null)}>
            <PublicationDrawer
              form={listingForm}
              busy={busy}
              media={listings.find((listing) => listing.id === listingForm.id) ? getListingMedia(listings.find((listing) => listing.id === listingForm.id) as AdminListing) : []}
              onClose={() => setDrawerMode(null)}
              onSubmit={savePublication}
              onChange={setListingForm}
              onToggleOperation={toggleOperation}
            />
          </Modal>
        ) : null}

        {drawerMode === "owner" ? (
          <Modal onClose={() => setDrawerMode(null)}>
            <OwnerDrawer form={ownerForm} busy={busy} onClose={() => setDrawerMode(null)} onSubmit={saveOwner} onChange={setOwnerForm} />
          </Modal>
        ) : null}

        {drawerMode === "property" ? (
          <Modal onClose={() => setDrawerMode(null)}>
            <PropertyDrawer
              form={propertyForm}
              busy={busy}
              photoFiles={photoFiles}
              videoFile={videoFile}
              mediaUploadProgress={mediaUploadProgress}
              coverPhotoIndex={coverPhotoIndex}
              fileInputResetKey={fileInputResetKey}
              videoUploadFeedback={videoUploadFeedback}
              currentMedia={properties.find((property) => property.id === propertyForm.id)?.asespro_property_media ?? []}
              hasPendingChanges={propertyHasPendingChanges}
              onClose={() => setDrawerMode(null)}
              onSubmit={saveProperty}
              onChange={setPropertyForm}
              onPhotosChange={(files) => {
                setPhotoFiles(files);
                setCoverPhotoIndex(0);
                setMediaUploadProgress(null);
              }}
              onCoverPhotoChange={setCoverPhotoIndex}
              onVideoFileChange={(file) => {
                setMediaUploadProgress(null);
                setMessage(null);
                setVideoUploadFeedback(null);
                if (!file) {
                  setVideoFile(null);
                  return;
                }
                void validateVideoForUpload(file)
                  .then(() => {
                    setVideoFile(file);
                    setVideoUploadFeedback(`Video listo para subir: ${file.name} (${Math.round(file.size / 1024 / 1024)} MB).`);
                    setMessage(`Video listo para subir: ${file.name} (${Math.round(file.size / 1024 / 1024)} MB).`);
                  })
                  .catch((error) => {
                    setVideoFile(null);
                    setVideoUploadFeedback(error instanceof Error ? error.message : "El video seleccionado no es compatible.");
                    setMessage(error instanceof Error ? error.message : "El video seleccionado no es compatible.");
                  });
              }}
              onUploadPhotos={() => void uploadSelectedPropertyPhotos()}
              onUploadVideo={() => void uploadSelectedPropertyVideoFile()}
              onDeleteMedia={(mediaId) => void deletePropertyMedia(propertyForm.id, mediaId)}
              onSaveMedia={(items) => void savePropertyMediaDraft(propertyForm.id, items)}
            />
          </Modal>
        ) : null}

        {activeTab !== "resumen" ? (
          <section className={styles.toolbar}>
            <input
              type="search"
              placeholder={`Buscar en ${title.toLowerCase()}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {activeTab === "publicaciones" ? (
              <select value={listingFilter} onChange={(event) => setListingFilter(event.target.value as ListingFilter)}>
                <option value="todos">Todos los estados</option>
                <option value="activo">Activas</option>
                <option value="desactivado">Desactivadas</option>
                <option value="alquilado">Alquiladas</option>
                <option value="vendido">Vendidas</option>
              </select>
            ) : null}
          </section>
        ) : null}

        {activeTab === "resumen" ? (
          <Dashboard
            listings={listings}
            properties={properties}
            owners={owners}
            activeRentals={activeRentals}
            activeListingsCount={activeListings.length}
            inactivePropertiesCount={inactiveProperties.length}
            pricedListings={pricedListings.length}
            mediaIssues={mediaIssues}
            onNewListing={openNewListingForm}
            onNewOwner={openNewOwnerForm}
            onSelectTab={selectTab}
          />
        ) : null}

        {activeTab === "publicaciones" ? (
          <ListingTable
            listings={filteredListings}
            busy={busy}
            onEdit={editListing}
            onStatusChange={updateListingStatus}
            onFeaturedChange={updateListingFeatured}
          />
        ) : null}

        {activeTab === "inmuebles" ? (
          <PropertyTable properties={filteredProperties} listings={listings} busy={busy} onEdit={editProperty} />
        ) : null}

        {activeTab === "propietarios" ? <OwnerTable owners={filteredOwners} properties={properties} onEdit={editOwner} /> : null}

        {activeTab === "alquileres" ? <RentalsPanel rentals={activeRentals} /> : null}
      </section>
    </main>
  );
}

function Metric({ label, value, hint, tone = "neutral" }: { label: string; value: number; hint: string; tone?: "neutral" | "warn" | "ok" }): JSX.Element {
  return (
    <article className={`${styles.metricCard} ${tone === "warn" ? styles.metricWarn : ""} ${tone === "ok" ? styles.metricOk : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }): JSX.Element {
  return (
    <div className={styles.modalLayer} role="presentation">
      <button type="button" className={styles.modalBackdrop} aria-label="Cerrar ventana" onClick={onClose} />
      <div className={styles.modalWindow} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

function MediaPreview({ media }: { media: AdminMedia[] }): JSX.Element {
  const photos = media.filter((item) => item.media_type === "photo" && item.public_url).sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const cover = photos[0];
  const video = media.find((item) => item.media_type === "video" && item.public_url);

  return (
    <div className={`${styles.mediaPreview} ${cover?.public_url && video?.public_url ? styles.mediaPreviewWithVideo : ""}`}>
      {cover?.public_url ? <img src={cover.public_url} alt="" style={{ objectPosition: getObjectPosition(cover) }} /> : <span>Sin foto</span>}
      {video?.public_url ? <video src={video.public_url} muted playsInline preload="metadata" /> : null}
    </div>
  );
}

function UploadProgress({ progress }: { progress: MediaUploadProgress }): JSX.Element {
  return (
    <div className={styles.uploadProgress} role="status" aria-live="polite">
      <div>
        <strong>{progress.label}</strong>
        <span>{progress.percent > 0 ? `${progress.percent}%` : "Preparando carga..."}</span>
      </div>
      <div className={styles.uploadTrack}>
        <span style={{ width: `${Math.max(progress.percent, 4)}%` }} />
      </div>
    </div>
  );
}

function TabActions({
  activeTab,
  onRefresh,
  onNewListing,
  onNewProperty,
  onNewOwner,
  onSelectTab,
}: {
  activeTab: PanelTab;
  onRefresh: () => void;
  onNewListing: () => void;
  onNewProperty: () => void;
  onNewOwner: () => void;
  onSelectTab: (tab: PanelTab) => void;
}): JSX.Element {
  if (activeTab === "resumen") {
    return (
      <div className={styles.topActions}>
        <button type="button" className={styles.secondaryLightButton} onClick={onRefresh}>
          Actualizar datos
        </button>
        <button type="button" className={styles.primaryButton} onClick={onNewListing}>
          Crear publicación
        </button>
      </div>
    );
  }

  if (activeTab === "publicaciones") {
    return (
      <div className={styles.topActions}>
        <button type="button" className={styles.primaryButton} onClick={onNewListing}>
          Publicar inmueble
        </button>
      </div>
    );
  }

  if (activeTab === "inmuebles") {
    return (
      <div className={styles.topActions}>
        <button type="button" className={styles.primaryButton} onClick={onNewProperty}>
          Nuevo inmueble
        </button>
      </div>
    );
  }

  if (activeTab === "propietarios") {
    return <div className={styles.topActions} />;
  }

  return (
    <div className={styles.topActions}>
      <button type="button" className={styles.secondaryLightButton} onClick={onRefresh}>
        Actualizar alquileres
      </button>
      <button type="button" className={styles.primaryButton} onClick={() => onSelectTab("publicaciones")}>
        Ver publicaciones
      </button>
    </div>
  );
}

function Dashboard({
  listings,
  properties,
  owners,
  activeRentals,
  activeListingsCount,
  inactivePropertiesCount,
  pricedListings,
  mediaIssues,
  onNewListing,
  onNewOwner,
  onSelectTab,
}: {
  listings: AdminListing[];
  properties: AdminProperty[];
  owners: AdminOwner[];
  activeRentals: ActiveRental[];
  activeListingsCount: number;
  inactivePropertiesCount: number;
  pricedListings: number;
  mediaIssues: AdminListing[];
  onNewListing: () => void;
  onNewOwner: () => void;
  onSelectTab: (tab: PanelTab) => void;
}): JSX.Element {
  return (
    <>
      <section className={styles.metrics} aria-label="Resumen operativo">
        <Metric label="Publicaciones activas" value={activeListingsCount} hint={`${listings.length} totales`} />
        <Metric label="Stock activo" value={properties.filter((property) => property.is_active).length} hint={`${inactivePropertiesCount} inactivos`} />
        <Metric label="Propietarios" value={owners.length} hint="fichas internas" />
        <Metric label="Alertas" value={mediaIssues.length} hint="sin media completa" tone={mediaIssues.length > 0 ? "warn" : "ok"} />
      </section>

      <section className={styles.dashboardGrid}>
      <article className={styles.workCard}>
        <div className={styles.sectionHead}>
          <div>
            <h3>Trabajo rápido</h3>
            <p>Acciones frecuentes para mantener la web al día.</p>
          </div>
        </div>
        <div className={styles.quickActions}>
          <button type="button" onClick={onNewListing}>Crear publicación</button>
          <button type="button" onClick={onNewOwner}>Agregar propietario</button>
          <button type="button" onClick={() => onSelectTab("inmuebles")}>Revisar stock</button>
        </div>
      </article>

      <article className={styles.workCard}>
        <div className={styles.sectionHead}>
          <div>
            <h3>Calidad de publicaciones</h3>
            <p>{pricedListings} con precio cargado de {listings.length} publicaciones.</p>
          </div>
        </div>
        <div className={styles.progressTrack}>
          <span style={{ width: `${listings.length > 0 ? Math.round((pricedListings / listings.length) * 100) : 0}%` }} />
        </div>
        <div className={styles.healthList}>
          <span>{mediaIssues.length} publicaciones sin foto o video completo</span>
          <span>{properties.filter((property) => property.is_active).length} inmuebles disponibles</span>
          <span>{owners.length} propietarios registrados</span>
          <span>{activeRentals.length} alquileres activos</span>
        </div>
      </article>

      <article className={`${styles.workCard} ${styles.wideCard}`}>
        <div className={styles.sectionHead}>
          <div>
            <h3>Alertas para publicar mejor</h3>
            <p>Prioridad: publicaciones activas sin media completa o sin precio.</p>
          </div>
        </div>
        <div className={styles.alertList}>
          {listings
            .filter((listing) => listingHasMediaIssue(listing) || typeof listing.price_amount !== "number")
            .slice(0, 5)
            .map((listing) => (
              <div key={listing.id} className={styles.alertRow}>
                <strong>{listing.title}</strong>
                <span>{listingHasMediaIssue(listing) ? "Falta foto/video" : "Falta precio"}</span>
              </div>
            ))}
          {listings.length === 0 ? <p className={styles.empty}>Todavía no hay publicaciones. Crea la primera para activar la web.</p> : null}
          {listings.length > 0 && mediaIssues.length === 0 ? <p className={styles.empty}>No hay alertas críticas de media.</p> : null}
        </div>
      </article>
      </section>
    </>
  );
}

function AmenityPicker({
  amenities,
  onChange,
}: {
  amenities: Record<PropertyAmenityKey, boolean>;
  onChange: (amenities: Record<PropertyAmenityKey, boolean>) => void;
}): JSX.Element {
  return (
    <div className={styles.amenityPicker}>
      <strong>Datos visibles en la ficha</strong>
      <div>
        {PROPERTY_AMENITIES.map((item) => (
          <label key={item.key}>
            <input
              type="checkbox"
              checked={amenities[item.key]}
              onChange={(event) => onChange({ ...amenities, [item.key]: event.target.checked })}
            />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function ListingDrawer({
  form,
  owners,
  properties,
  step,
  busy,
  onClose,
  onSubmit,
  onChange,
  onStepChange,
  onSelectProperty,
  onToggleOperation,
  photoFiles,
  mediaUploadProgress,
  coverPhotoIndex,
  fileInputResetKey,
  onPhotosChange,
  onCoverPhotoChange,
  onVideoChange,
}: {
  form: FormState;
  owners: AdminOwner[];
  properties: AdminProperty[];
  step: ListingWizardStep;
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (form: FormState) => void;
  onStepChange: (step: ListingWizardStep) => void;
  onSelectProperty: (propertyId: string) => void;
  onToggleOperation: (operation: PropertyOperation) => void;
  photoFiles: File[];
  mediaUploadProgress: MediaUploadProgress | null;
  coverPhotoIndex: number;
  fileInputResetKey: number;
  onPhotosChange: (files: File[]) => void;
  onCoverPhotoChange: (index: number) => void;
  onVideoChange: (file: File | null) => void;
}): JSX.Element {
  const canContinueOwner = form.ownerMode === "new" ? form.newOwnerFullName.trim().length > 0 : form.ownerId.length > 0;
  const canContinueProperty = form.propertyMode === "new" ? form.street.trim().length > 0 && form.streetNumber.trim().length > 0 : form.propertyId.length > 0;
  const availableOperations = getAvailableOperations(form);

  return (
    <section className={styles.drawer} aria-label="Formulario de publicación">
      <div className={styles.drawerHead}>
        <div>
          <h3>{form.id ? "Editar publicación" : "Alta de inmueble y publicación"}</h3>
          <p>El inmueble guarda la ficha y la media. La publicación solo define cómo sale a la web.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose}>Cerrar</button>
      </div>

      <div className={styles.stepper} aria-label="Pasos de creación">
        {[
          ["propietario", "1. Propietario"],
          ["inmueble", "2. Inmueble"],
          ["publicacion", "3. Publicación"],
        ].map(([id, label]) => (
          <button key={id} type="button" className={step === id ? styles.stepActive : ""} onClick={() => onStepChange(id as ListingWizardStep)}>
            {label}
          </button>
        ))}
      </div>

      <form className={styles.formPanel} onSubmit={onSubmit}>
        {step === "propietario" ? (
          <div className={styles.formSection}>
            <h4>Propietario</h4>
            <div className={styles.segmented}>
              <button type="button" className={form.ownerMode === "existing" ? styles.segmentActive : ""} onClick={() => onChange({ ...form, ownerMode: "existing" })}>Elegir existente</button>
              <button type="button" className={form.ownerMode === "new" ? styles.segmentActive : ""} onClick={() => onChange({ ...form, ownerMode: "new" })}>Crear nuevo</button>
            </div>
            {form.ownerMode === "existing" ? (
              <label>Propietario
                <select value={form.ownerId} onChange={(event) => onChange({ ...form, ownerId: event.target.value })} required>
                  <option value="">Seleccionar propietario</option>
                  {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name}</option>)}
                </select>
              </label>
            ) : (
              <>
                <div className={styles.twoCols}>
                  <label>Nombre completo<input value={form.newOwnerFullName} onChange={(event) => onChange({ ...form, newOwnerFullName: event.target.value })} required /></label>
                  <label>Teléfono<input value={form.newOwnerPhone} onChange={(event) => onChange({ ...form, newOwnerPhone: event.target.value })} /></label>
                </div>
                <label>Email<input type="email" value={form.newOwnerEmail} onChange={(event) => onChange({ ...form, newOwnerEmail: event.target.value })} /></label>
                <label>Notas internas<textarea value={form.newOwnerNotes} onChange={(event) => onChange({ ...form, newOwnerNotes: event.target.value })} /></label>
              </>
            )}
            <div className={styles.formNav}>
              <button type="button" className={styles.primaryButton} disabled={!canContinueOwner} onClick={() => onStepChange("inmueble")}>Continuar al inmueble</button>
            </div>
          </div>
        ) : null}

        {step === "inmueble" ? (
          <div className={styles.formSection}>
            <h4>Inmueble</h4>
            <div className={styles.segmented}>
              <button type="button" className={form.propertyMode === "new" ? styles.segmentActive : ""} onClick={() => onChange({ ...form, propertyMode: "new", propertyId: "" })}>Crear inmueble</button>
              <button type="button" className={form.propertyMode === "existing" ? styles.segmentActive : ""} onClick={() => onChange({ ...form, propertyMode: "existing" })}>Elegir existente</button>
            </div>
            {form.propertyMode === "existing" ? (
              <label>Inmueble
                <select value={form.propertyId} onChange={(event) => onSelectProperty(event.target.value)} required>
                  <option value="">Seleccionar inmueble</option>
                  {properties.map((property) => <option key={property.id} value={property.id}>{property.title} - {property.location_text ?? "sin ubicación"}</option>)}
                </select>
              </label>
            ) : null}
            <div className={styles.twoCols}>
              <label>Tipo<select value={form.propertyType} onChange={(event) => onChange({ ...form, propertyType: event.target.value as PropertyType })}><option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="terreno">Terreno</option></select></label>
              <label>País<input value={form.country} readOnly /></label>
            </div>
            {form.propertyMode === "new" ? (
              <>
                <div className={styles.twoCols}>
                  <label>Calle<input value={form.street} onChange={(event) => onChange({ ...form, street: event.target.value })} required /></label>
                  <label>Número<input value={form.streetNumber} onChange={(event) => onChange({ ...form, streetNumber: event.target.value })} required /></label>
                </div>
                <div className={styles.twoCols}>
                  <label>Ciudad<select value={form.city} onChange={(event) => {
                    const city = event.target.value as FormState["city"];
                    onChange({ ...form, city, department: city === "Paso de los Toros" ? "Tacuarembo" : "Durazno" });
                  }}><option value="Paso de los Toros">Paso de los Toros</option><option value="Centenario">Centenario</option></select></label>
                  <label>Departamento<input value={form.department} readOnly /></label>
                </div>
              </>
            ) : (
              <label>Dirección<input value={form.locationText} readOnly /></label>
            )}
            <div className={styles.threeCols}>
              <label>Dormitorios<input value={form.bedrooms} onChange={(event) => onChange({ ...form, bedrooms: event.target.value })} /></label>
              <label>Baños<input value={form.bathrooms} onChange={(event) => onChange({ ...form, bathrooms: event.target.value })} /></label>
              <label>m2<input value={form.areaM2} onChange={(event) => onChange({ ...form, areaM2: event.target.value })} /></label>
            </div>
            <AmenityPicker amenities={form.amenities} onChange={(amenities) => onChange({ ...form, amenities })} />
            <div className={styles.operations}>
              <label><input type="checkbox" checked={form.forRent} onChange={(event) => onChange(ensureOperationForProperty({ ...form, forRent: event.target.checked }))} /> Disponible para alquiler</label>
              <label><input type="checkbox" checked={form.forSale} onChange={(event) => onChange(ensureOperationForProperty({ ...form, forSale: event.target.checked }))} /> Disponible para venta</label>
            </div>
            {form.forRent ? (
              <div className={styles.twoCols}>
                <label>Precio alquiler<input inputMode="decimal" value={form.rentPrice} onChange={(event) => onChange({ ...form, rentPrice: event.target.value })} /></label>
                <label>Moneda alquiler<input list="admin-currencies" value={form.rentCurrency} onChange={(event) => onChange({ ...form, rentCurrency: event.target.value.toUpperCase() as PropertyCurrency })} /><datalist id="admin-currencies"><option value="UYU" /><option value="USD" /><option value="EUR" /></datalist></label>
              </div>
            ) : null}
            {form.forSale ? (
              <div className={styles.twoCols}>
                <label>Precio venta<input inputMode="decimal" value={form.salePrice} onChange={(event) => onChange({ ...form, salePrice: event.target.value })} /></label>
                <label>Moneda venta<input list="admin-currencies" value={form.saleCurrency} onChange={(event) => onChange({ ...form, saleCurrency: event.target.value.toUpperCase() as PropertyCurrency })} /></label>
              </div>
            ) : null}
            <label>Descripción / ficha general<textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></label>
            <div className={styles.twoCols}>
              <label>Imágenes del inmueble<input type="file" accept="image/*" multiple onChange={(event) => onPhotosChange(Array.from(event.target.files ?? []))} /></label>
              <label>Video del inmueble<input key={`listing-video-${fileInputResetKey}`} type="file" accept="video/mp4,.mp4" onChange={(event) => onVideoChange(event.target.files?.[0] ?? null)} /></label>
            </div>
            {photoFiles.length > 0 ? (
              <label>Imagen principal<select value={coverPhotoIndex} onChange={(event) => onCoverPhotoChange(Number(event.target.value))}>
                {photoFiles.map((file, index) => <option key={`${file.name}-${index}`} value={index}>{file.name}</option>)}
              </select></label>
            ) : null}
            {mediaUploadProgress ? <UploadProgress progress={mediaUploadProgress} /> : null}
            <div className={styles.formNav}>
              <button type="button" className={styles.secondaryLightButton} onClick={() => onStepChange("propietario")}>Volver</button>
              <button type="button" className={styles.primaryButton} disabled={!canContinueProperty} onClick={() => onStepChange("publicacion")}>Continuar a publicación</button>
            </div>
          </div>
        ) : null}

        {step === "publicacion" ? (
          <div className={styles.formSection}>
          <h4>Publicación</h4>
          {availableOperations.length === 0 ? <p className={styles.empty}>Activa venta o alquiler en el inmueble para poder crear una publicación.</p> : null}
          <div className={styles.operations}>
            {availableOperations.map((operation) => (
              <label key={operation}><input type="radio" checked={form.operations[0] === operation} onChange={() => onToggleOperation(operation)} /> {operation === "alquiler" ? "Alquiler" : "Venta"}</label>
            ))}
          </div>
          <label className={styles.checkboxLine}>
            <input type="checkbox" checked={form.isFeatured} onChange={(event) => onChange({ ...form, isFeatured: event.target.checked })} />
            Destacar en home
          </label>
          <div className={styles.formNav}>
            <button type="button" className={styles.secondaryLightButton} onClick={() => onStepChange("inmueble")}>Volver</button>
            <button type="submit" className={styles.primaryButton} disabled={busy || availableOperations.length === 0}>{busy ? "Publicando..." : "Crear publicación"}</button>
          </div>
        </div>
        ) : null}

      </form>
    </section>
  );
}

function PublicationDrawer({
  form,
  busy,
  media,
  onClose,
  onSubmit,
  onChange,
  onToggleOperation,
}: {
  form: FormState;
  busy: boolean;
  media: AdminMedia[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (form: FormState) => void;
  onToggleOperation: (operation: PropertyOperation) => void;
}): JSX.Element {
  const availableOperations = getPublicationOperations(form);
  const cover = media.find((item) => item.media_type === "photo" && item.is_cover && item.public_url) ?? media.find((item) => item.media_type === "photo" && item.public_url);
  const selectedOperation = form.operations[0] ?? availableOperations[0] ?? "alquiler";
  const selectedPrice = selectedOperation === "venta" ? Number(form.salePrice) : Number(form.rentPrice);
  const selectedCurrency = selectedOperation === "venta" ? form.saleCurrency : form.rentCurrency;
  const summary = form.publicSummary || form.description;
  return (
    <section className={styles.drawer} aria-label="Ficha de publicación">
      <div className={styles.drawerHead}>
        <div>
          <h3>Editar publicación</h3>
          <p>Ficha comercial visible en la web. La ficha del inmueble se edita desde Inmuebles.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose}>Cerrar</button>
      </div>
      <form className={styles.formPanel} onSubmit={onSubmit}>
        <div className={styles.editorGrid}>
          <section className={styles.previewPanel} aria-label="Vista previa web">
            <div className={styles.previewCard}>
              <div className={styles.previewImage}>
                {cover?.public_url ? <img src={cover.public_url} alt="" style={{ objectPosition: getObjectPosition(cover) }} /> : <span>Sin portada</span>}
                <small>{selectedOperation === "venta" ? "Venta" : "Alquiler"}</small>
              </div>
              <div className={styles.previewBody}>
                <strong>{form.title || "Titulo de publicacion"}</strong>
                <p>{summary || "Resumen publico para la tarjeta y vistas previas."}</p>
                <span>{formatMoney(Number.isFinite(selectedPrice) ? selectedPrice : null, selectedCurrency)}</span>
              </div>
            </div>
          </section>
          <section className={styles.editorFields}>
            <div className={styles.twoCols}>
              <label>Estado web<select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as PropertyStatus })}><option value="activo">Activo</option><option value="desactivado">Desactivado</option></select></label>
              <label>Workflow<select value={form.publishStatus} onChange={(event) => onChange({ ...form, publishStatus: event.target.value as FormState["publishStatus"] })}><option value="borrador">Borrador</option><option value="revision">Revision</option><option value="publicado">Publicado</option><option value="pausado">Pausado</option><option value="archivado">Archivado</option></select></label>
            </div>
            <div className={styles.twoCols}>
              <label>Visibilidad<select value={form.visibility} onChange={(event) => onChange({ ...form, visibility: event.target.value as FormState["visibility"] })}><option value="web">Web publica</option><option value="privado">Privado</option><option value="link_directo">Solo link directo</option></select></label>
              <label>Orden destacada<input inputMode="numeric" value={form.featuredOrder} onChange={(event) => onChange({ ...form, featuredOrder: event.target.value })} /></label>
            </div>
            <label>Titulo publico<input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} /></label>
            <label>Slug<input value={form.slug} onChange={(event) => onChange({ ...form, slug: event.target.value })} placeholder="casa-centro-paso-de-los-toros" /></label>
            <label>Resumen para cards<textarea value={form.publicSummary} onChange={(event) => onChange({ ...form, publicSummary: event.target.value })} /></label>
            <label>Descripcion publica<textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></label>
            <div className={styles.twoCols}>
              <label>SEO title<input value={form.seoTitle} onChange={(event) => onChange({ ...form, seoTitle: event.target.value })} /></label>
              <label>Seccion home<input value={form.homepageSection} onChange={(event) => onChange({ ...form, homepageSection: event.target.value })} /></label>
            </div>
            <label>SEO description<textarea value={form.seoDescription} onChange={(event) => onChange({ ...form, seoDescription: event.target.value })} /></label>
            <label>Notas internas<textarea value={form.internalNotes} onChange={(event) => onChange({ ...form, internalNotes: event.target.value })} /></label>
          </section>
        </div>
        <div className={styles.operations}>
          {availableOperations.map((operation) => (
            <label key={operation}><input type="radio" checked={form.operations[0] === operation} onChange={() => onToggleOperation(operation)} /> {operation === "alquiler" ? "Alquiler" : "Venta"}</label>
          ))}
        </div>
        <label className={styles.checkboxLine}>
          <input type="checkbox" checked={form.isFeatured} onChange={(event) => onChange({ ...form, isFeatured: event.target.checked })} />
          Destacar en home
        </label>
        <button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Guardando..." : "Guardar publicación"}</button>
      </form>
    </section>
  );
}

function OwnerDrawer({
  form,
  busy,
  onClose,
  onSubmit,
  onChange,
}: {
  form: OwnerFormState;
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (form: OwnerFormState) => void;
}): JSX.Element {
  return (
    <section className={styles.drawer} aria-label="Formulario de propietario">
      <div className={styles.drawerHead}>
        <div>
          <h3>{form.id ? "Editar propietario" : "Nuevo propietario"}</h3>
          <p>Ficha interna para contacto, seguimiento y vinculación con inmuebles.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose}>Cerrar</button>
      </div>
      <form className={styles.formPanel} onSubmit={onSubmit}>
        <div className={styles.twoCols}>
          <label>Nombre completo<input value={form.fullName} onChange={(event) => onChange({ ...form, fullName: event.target.value })} required /></label>
          <label>Teléfono<input value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} /></label>
        </div>
        <label>Email<input type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} /></label>
        <label>Notas<textarea value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} /></label>
        <button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Guardando..." : "Guardar propietario"}</button>
      </form>
    </section>
  );
}

function PropertyDrawer({
  form,
  busy,
  photoFiles,
  videoFile,
  mediaUploadProgress,
  coverPhotoIndex,
  fileInputResetKey,
  videoUploadFeedback,
  currentMedia,
  hasPendingChanges,
  onClose,
  onSubmit,
  onChange,
  onPhotosChange,
  onCoverPhotoChange,
  onVideoFileChange,
  onUploadPhotos,
  onUploadVideo,
  onDeleteMedia,
  onSaveMedia,
}: {
  form: PropertyFormState;
  busy: boolean;
  photoFiles: File[];
  videoFile: File | null;
  mediaUploadProgress: MediaUploadProgress | null;
  coverPhotoIndex: number;
  fileInputResetKey: number;
  videoUploadFeedback: string | null;
  currentMedia: AdminMedia[];
  hasPendingChanges: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (form: PropertyFormState) => void;
  onPhotosChange: (files: File[]) => void;
  onCoverPhotoChange: (index: number) => void;
  onVideoFileChange: (file: File | null) => void;
  onUploadPhotos: () => void;
  onUploadVideo: () => void;
  onDeleteMedia: (mediaId: string) => void;
  onSaveMedia: (items: AdminMedia[]) => void;
}): JSX.Element {
  const [mediaDraft, setMediaDraft] = useState<AdminMedia[]>([]);

  useEffect(() => {
    setMediaDraft([...currentMedia].sort(sortMedia));
  }, [currentMedia]);

  const sortedMedia = [...mediaDraft].sort(sortMedia);
  const mediaHasPendingChanges = JSON.stringify(sortedMedia) !== JSON.stringify([...currentMedia].sort(sortMedia));
  const photoMedia = sortedMedia.filter((item) => item.media_type === "photo");
  const videoMedia = sortedMedia.filter((item) => item.media_type === "video");

  function sortMedia(a: AdminMedia, b: AdminMedia): number {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  }

  function updateMediaDraft(mediaType: "photo" | "video", items: AdminMedia[]): void {
    setMediaDraft((current) => {
      const normalizedItems = items.map((item, index) => ({
        ...item,
        sort_order: index,
        is_cover: mediaType === "photo" ? index === 0 : false,
      }));
      return [...current.filter((item) => item.media_type !== mediaType), ...normalizedItems].sort(sortMedia);
    });
  }

  function updateMediaItem(mediaType: "photo" | "video", item: AdminMedia, updates: Partial<AdminMedia>): void {
    updateMediaDraft(
      mediaType,
      (mediaType === "photo" ? photoMedia : videoMedia).map((candidate) => (candidate.id === item.id ? { ...candidate, ...updates } : candidate)),
    );
  }

  return (
    <section className={styles.drawer} aria-label="Formulario de inmueble">
      <div className={styles.drawerHead}>
        <div>
          <h3>Editar inmueble</h3>
          <p>Ficha interna del inmueble. El estado de publicación se maneja en Publicaciones.</p>
        </div>
        <button type="button" className={styles.closeButton} aria-label="Cerrar" onClick={onClose}>x</button>
      </div>
      <form className={styles.formPanel} onSubmit={onSubmit}>
        <div className={styles.twoCols}>
          <label>Título<input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} required /></label>
          <label>Estado<select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as PropertyOperationalStatus })}><option value="disponible">Disponible</option><option value="alquilado">Alquilado</option><option value="vendido">Vendido</option></select></label>
        </div>
        <div className={styles.twoCols}>
          <label>Tipo<select value={form.propertyType} onChange={(event) => onChange({ ...form, propertyType: event.target.value as PropertyType })}><option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="terreno">Terreno</option></select></label>
          <label>Dirección<input value={form.locationText} onChange={(event) => onChange({ ...form, locationText: event.target.value })} required /></label>
        </div>
        <div className={styles.threeCols}>
          <label>Dormitorios<input value={form.bedrooms} onChange={(event) => onChange({ ...form, bedrooms: event.target.value })} /></label>
          <label>Baños<input value={form.bathrooms} onChange={(event) => onChange({ ...form, bathrooms: event.target.value })} /></label>
          <label>m2<input value={form.areaM2} onChange={(event) => onChange({ ...form, areaM2: event.target.value })} /></label>
        </div>
        <AmenityPicker amenities={form.amenities} onChange={(amenities) => onChange({ ...form, amenities })} />
        <div className={styles.operations}>
          <label><input type="checkbox" checked={form.forRent} onChange={(event) => onChange({ ...form, forRent: event.target.checked })} /> Disponible para alquiler</label>
          <label><input type="checkbox" checked={form.forSale} onChange={(event) => onChange({ ...form, forSale: event.target.checked })} /> Disponible para venta</label>
        </div>
        {form.forRent ? (
          <div className={styles.twoCols}>
            <label>Precio alquiler<input inputMode="decimal" value={form.rentPrice} onChange={(event) => onChange({ ...form, rentPrice: event.target.value })} /></label>
            <label>Moneda alquiler<input list="admin-currencies" value={form.rentCurrency} onChange={(event) => onChange({ ...form, rentCurrency: event.target.value.toUpperCase() as PropertyCurrency })} /></label>
          </div>
        ) : null}
        {form.forSale ? (
          <div className={styles.twoCols}>
            <label>Precio venta<input inputMode="decimal" value={form.salePrice} onChange={(event) => onChange({ ...form, salePrice: event.target.value })} /></label>
            <label>Moneda venta<input list="admin-currencies" value={form.saleCurrency} onChange={(event) => onChange({ ...form, saleCurrency: event.target.value.toUpperCase() as PropertyCurrency })} /></label>
          </div>
        ) : null}
        <label>Descripción<textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></label>
        <div className={styles.fileManager}>
          <div className={styles.fileManagerHead}>
            <div>
              <strong>Editor multimedia</strong>
              <p>Reordena, elegi portada, ajusta foco y guarda todo junto.</p>
            </div>
            <div className={styles.fileManagerActions}>
              <span>{sortedMedia.length} archivos</span>
              <button type="button" className={mediaHasPendingChanges ? styles.primaryButton : styles.disabledSaveButton} disabled={busy || !mediaHasPendingChanges} onClick={() => onSaveMedia(sortedMedia)}>
                {busy ? "Guardando..." : "Guardar multimedia"}
              </button>
            </div>
          </div>
          {sortedMedia.length > 0 ? (
            <div className={styles.fileSections}>
              <MediaSection title="Fotos" mediaType="photo" items={photoMedia} busy={busy} onDeleteMedia={onDeleteMedia} onReorder={(orderedItems) => updateMediaDraft("photo", orderedItems)} onUpdateMedia={updateMediaItem} />
              <MediaSection title="Videos" mediaType="video" items={videoMedia} busy={busy} onDeleteMedia={onDeleteMedia} onReorder={(orderedItems) => updateMediaDraft("video", orderedItems)} onUpdateMedia={updateMediaItem} />
            </div>
          ) : (
            <p className={styles.empty}>Este inmueble todavía no tiene archivos cargados.</p>
          )}
        </div>
        <div className={styles.twoCols}>
          <label>Nuevas imágenes<input type="file" accept="image/*" multiple onChange={(event) => onPhotosChange(Array.from(event.target.files ?? []))} /></label>
          <label>Video MP4 vertical<input key={`property-video-${fileInputResetKey}`} type="file" accept="video/mp4,.mp4" onChange={(event) => onVideoFileChange(event.target.files?.[0] ?? null)} /></label>
        </div>
        <p className={styles.empty}>Video permitido: MP4 vertical 9:16, H.264/AAC, hasta 500 MB.</p>
        {photoFiles.length > 0 ? (
          <>
            <label>Imagen principal<select value={coverPhotoIndex} onChange={(event) => onCoverPhotoChange(Number(event.target.value))}>
              {photoFiles.map((file, index) => <option key={`${file.name}-${index}`} value={index}>{file.name}</option>)}
            </select></label>
            <div className={styles.pendingVideoBox}>
              <div>
                <strong>Imágenes seleccionadas</strong>
                <span>{photoFiles.length} archivos listos para cargar</span>
              </div>
              <button type="button" className={styles.primaryButton} disabled={busy} onClick={onUploadPhotos}>
                {busy ? "Cargando..." : "Cargar imágenes"}
              </button>
            </div>
          </>
        ) : null}
        {videoFile ? (
          <div className={styles.pendingVideoBox}>
            <div>
              <strong>Video seleccionado</strong>
              <span>{videoFile.name} - {Math.round(videoFile.size / 1024 / 1024)} MB</span>
            </div>
            <button type="button" className={styles.primaryButton} disabled={busy} onClick={onUploadVideo}>
              {busy ? "Cargando..." : "Subir video"}
            </button>
          </div>
        ) : null}
        {videoUploadFeedback ? <p className={styles.empty}>{videoUploadFeedback}</p> : null}
        {mediaUploadProgress ? <UploadProgress progress={mediaUploadProgress} /> : null}
        <div className={styles.formFooterActions}>
          <button type="button" className={styles.secondaryLightButton} disabled={busy} onClick={onClose}>Cerrar</button>
          <button type="submit" className={hasPendingChanges ? styles.primaryButton : styles.disabledSaveButton} disabled={busy || !hasPendingChanges}>
            {busy ? "Guardando..." : "Guardar inmueble"}
          </button>
        </div>
      </form>
    </section>
  );
}

function PropertyTable({
  properties,
  listings,
  busy,
  onEdit,
}: {
  properties: AdminProperty[];
  listings: AdminListing[];
  busy: boolean;
  onEdit: (property: AdminProperty) => void;
}): JSX.Element {
  return (
    <section className={styles.tablePanel}>
      <div className={styles.sectionHead}>
        <div>
          <h3>Inmuebles</h3>
          <p>Inventario físico. El estado operativo no activa ni desactiva publicaciones.</p>
        </div>
        <span>{properties.length}</span>
      </div>
      {properties.map((property) => {
        const propertyListings = listings.filter((listing) => listing.property_id === property.id);
        const media = property.asespro_property_media?.length ? property.asespro_property_media : propertyListings.flatMap((listing) => listing.asespro_listing_media);
        return (
          <article key={property.id} className={`${styles.rowCard} ${styles.rowCardWithMedia}`}>
            <MediaPreview media={media} />
            <div className={styles.rowMain}>
              <strong>{property.title}</strong>
              <p>{property.location_text ?? "Sin ubicación"} - {property.property_type}</p>
              <small>{property.bedrooms ?? "N/D"} dorm - {property.bathrooms ?? "N/D"} baños - {property.area_m2 ?? "N/D"} m2</small>
            </div>
            <div className={styles.rowActions}>
              <span className={property.status === "disponible" ? styles.statusActive : styles.statusMuted}>{property.status}</span>
              <button type="button" disabled={busy} onClick={() => onEdit(property)}>
                Editar
              </button>
            </div>
          </article>
        );
      })}
      {properties.length === 0 ? <p className={styles.empty}>Todavía no hay inmuebles cargados.</p> : null}
    </section>
  );
}

function OwnerTable({ owners, properties, onEdit }: { owners: AdminOwner[]; properties: AdminProperty[]; onEdit: (owner: AdminOwner) => void }): JSX.Element {
  return (
    <section className={styles.tablePanel}>
      <div className={styles.sectionHead}>
        <div>
          <h3>Propietarios</h3>
          <p>Fichas de contacto para operar inmuebles sin depender de memoria o planillas externas.</p>
        </div>
        <span>{owners.length}</span>
      </div>
      {owners.map((owner) => {
        const linkedProperties = properties.filter((property) => property.asespro_property_owners?.some((link) => link.owner_id === owner.id));
        return (
          <article key={owner.id} className={styles.rowCard}>
            <div className={styles.rowMain}>
              <strong>{owner.full_name}</strong>
              <p>{owner.phone ?? "Sin teléfono"} - {owner.email ?? "Sin email"}</p>
              <small>{linkedProperties.length > 0 ? linkedProperties.map((property) => property.title).join(" | ") : "Sin inmuebles vinculados"}</small>
            </div>
            <div className={styles.rowActions}>
              <span className={styles.statusMuted}>{linkedProperties.length} inmuebles</span>
              <button type="button" onClick={() => onEdit(owner)}>Editar</button>
            </div>
          </article>
        );
      })}
      {owners.length === 0 ? <p className={styles.empty}>Todavía no hay propietarios cargados.</p> : null}
    </section>
  );
}

function RentalsPanel({ rentals }: { rentals: ActiveRental[] }): JSX.Element {
  return (
    <section className={styles.tablePanel}>
      <div className={styles.sectionHead}>
        <div>
          <h3>Alquileres activos</h3>
          <p>Seguimiento operativo de contratos vigentes. La proxima mejora natural es pagos y vencimientos.</p>
        </div>
        <span>{rentals.length}</span>
      </div>
      {rentals.map((rental) => (
        <article key={rental.id} className={styles.rowCard}>
          <div className={styles.rowMain}>
            <strong>{formatMoney(rental.monthly_price, "UYU")}</strong>
            <p>Inicio {rental.start_date} - {rental.end_date ?? "sin fecha de fin"}</p>
          </div>
          <span className={styles.statusActive}>{rental.status}</span>
        </article>
      ))}
      {rentals.length === 0 ? <p className={styles.empty}>No hay alquileres activos cargados.</p> : null}
    </section>
  );
}
