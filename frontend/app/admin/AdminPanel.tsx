"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { PropertyCurrency, PropertyOperation, PropertyStatus, PropertyType } from "@/lib/properties";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

import styles from "./AdminPanel.module.css";

type AdminMedia = {
  id: string;
  media_type: "photo" | "video";
  public_url: string | null;
  storage_path?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
};

type MediaUploadProgress = {
  label: string;
  percent: number;
};

type MediaUploadResponse = {
  media?: AdminMedia;
  error?: string;
};

type AdminListing = {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  price_amount: number | null;
  price_currency: PropertyCurrency | null;
  is_featured?: boolean | null;
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
    asespro_property_media?: AdminMedia[];
  } | null;
  asespro_listing_operations: Array<{ operation: PropertyOperation }>;
  asespro_listing_media: AdminMedia[];
};

type PropertyOperationalStatus = "disponible" | "alquilado" | "vendido";

type AdminProperty = {
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
  asespro_property_owners?: Array<{ owner_id: string }>;
  asespro_property_media?: AdminMedia[];
};

type AdminOwner = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

type ActiveRental = {
  id: string;
  monthly_price: number;
  start_date: string;
  end_date: string | null;
  status: string;
};

type OverviewPayload = {
  listings: AdminListing[];
  properties: AdminProperty[];
  owners: AdminOwner[];
  activeRentals: ActiveRental[];
  error?: string;
};

type FormState = {
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
  operations: PropertyOperation[];
  status: PropertyStatus;
};

type OwnerFormState = {
  id: string | null;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
};

type PropertyFormState = {
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
};

type PanelTab = "resumen" | "publicaciones" | "inmuebles" | "propietarios" | "alquileres";
type DrawerMode = "listing" | "owner" | "property" | "publication" | null;
type ListingFilter = "todos" | PropertyStatus;
type ListingWizardStep = "propietario" | "inmueble" | "publicacion";

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
  operations: ["alquiler"],
  status: "activo",
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
    description: "Lectura rapida de la salud de la web, stock, propietarios y alertas de publicacion.",
  },
  publicaciones: {
    eyebrow: "Web publica",
    title: "Publicaciones",
    description: "Publica inmuebles ya cargados y administra su estado desde la planilla.",
  },
  inmuebles: {
    eyebrow: "Inventario interno",
    title: "Inmuebles",
    description: "Ficha madre: direccion, datos tecnicos, propietario, imagenes y video.",
  },
  propietarios: {
    eyebrow: "Relacion comercial",
    title: "Propietarios",
    description: "Administra fichas de contacto, notas y datos utiles de cada propietario.",
  },
  alquileres: {
    eyebrow: "Gestion mensual",
    title: "Alquileres activos",
    description: "Seguimiento de contratos vigentes, montos y fechas clave.",
  },
};

function formatMoney(amount: number | null, currency: PropertyCurrency | null): string {
  if (typeof amount !== "number") return "Sin precio";
  const normalizedCurrency = currency || "USD";
  try {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${normalizedCurrency} ${new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(amount)}`;
  }
}

function operationLabel(operations: Array<{ operation: PropertyOperation }>): string {
  const values = operations.map((item) => item.operation);
  if (values.includes("alquiler") && values.includes("venta")) return "Alquiler / Venta";
  return values[0] === "venta" ? "Venta" : "Alquiler";
}

function listingHasMediaIssue(listing: AdminListing): boolean {
  const media = getListingMedia(listing);
  const photos = media.filter((item) => item.media_type === "photo").length;
  const hasVideo = media.some((item) => item.media_type === "video");
  return photos === 0 || !hasVideo;
}

function getListingMedia(listing: AdminListing): AdminMedia[] {
  const propertyMedia = listing.asespro_properties?.asespro_property_media ?? [];
  return propertyMedia.length > 0 ? propertyMedia : listing.asespro_listing_media;
}

function matchesSearch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

function reorderMediaItems(items: AdminMedia[], fromId: string, toId: string): AdminMedia[] {
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;
  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

function buildAddress(form: FormState): string {
  const streetLine = [form.street.trim(), form.streetNumber.trim()].filter(Boolean).join(" ");
  return [streetLine, form.city, form.department, form.country].filter(Boolean).join(", ");
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
  const [mediaUploadProgress, setMediaUploadProgress] = useState<MediaUploadProgress | null>(null);
  const [query, setQuery] = useState("");
  const [listingFilter, setListingFilter] = useState<ListingFilter>("todos");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const propertyHasPendingChanges = useMemo(() => {
    if (drawerMode !== "property") return false;
    return JSON.stringify(propertyForm) !== JSON.stringify(propertyFormBaseline) || photoFiles.length > 0;
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
        setSupabase(client);
      })
      .catch(() => setMessage("No se pudo cargar la configuracion de Supabase."));
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
      setMessage("Supabase publico no esta configurado.");
      return;
    }

    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error || !data.session) {
      setMessage(error?.message ?? "No se pudo iniciar sesion.");
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
    setVideoFile(null);
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
      operations: operations.length > 0 ? operations : ["alquiler"],
      status: listing.status,
    });
    setDrawerMode("publication");
    setActiveTab("publicaciones");
    setMessage("Editando publicacion existente.");
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
    setVideoFile(null);
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
      setMessage(error instanceof Error ? error.message : "La publicacion se guardo, pero fallo la carga de media.");
      return;
    }
    setListingForm(EMPTY_LISTING_FORM);
    setPhotoFiles([]);
    setCoverPhotoIndex(0);
    setVideoFile(null);
    setMediaUploadProgress(null);
    setDrawerMode(null);
    await loadOverview(token);
    setBusy(false);
    setMessage("Publicacion guardada.");
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
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setBusy(false);
      setMessage(payload.error ?? "No se pudo guardar la publicacion.");
      return;
    }

    setListingForm(EMPTY_LISTING_FORM);
    setDrawerMode(null);
    await loadOverview(token);
    setBusy(false);
    setMessage("Publicacion actualizada.");
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

    if (photoFiles.length > 0) {
      try {
        await uploadPropertyPhotos(propertyForm.id);
      } catch (error) {
        setBusy(false);
        setMediaUploadProgress(null);
        setMessage(error instanceof Error ? error.message : "El inmueble se guardo, pero fallo la carga de media.");
        return;
      }
    }

    setPropertyForm(EMPTY_PROPERTY_FORM);
    setPropertyFormBaseline(EMPTY_PROPERTY_FORM);
    setPhotoFiles([]);
    setCoverPhotoIndex(0);
    setVideoFile(null);
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
      data.set("replaceGroup", index === 0 ? "true" : "false");
      const payload = await uploadMediaRequest(`/api/admin/properties/${propertyId}/media`, data, token, `Subiendo imagen ${index + 1} de ${photoFiles.length}`);
      if (payload.media?.media_type !== "photo") {
        throw new Error(`La imagen ${file.name} subio, pero no quedo registrada como foto.`);
      }
    }
  }

  async function uploadPropertyVideo(propertyId: string): Promise<void> {
    if (!token || !propertyId || !videoFile) return;
    const data = new FormData();
    data.set("file", videoFile);
    data.set("mediaType", "video");
    data.set("isCover", "false");
    data.set("replaceGroup", "true");
    const payload = await uploadMediaRequest(`/api/admin/properties/${propertyId}/media`, data, token, `Subiendo video ${videoFile.name}`);
    if (payload.media?.media_type !== "video") {
      throw new Error(`El video ${videoFile.name} subio, pero no quedo registrado como video.`);
    }
  }

  async function uploadSelectedPropertyVideo(): Promise<void> {
    if (!token || !propertyForm.id || !videoFile) return;
    setBusy(true);
    setMessage(null);
    setMediaUploadProgress(null);

    try {
      await uploadPropertyVideo(propertyForm.id);
      setVideoFile(null);
      setMediaUploadProgress(null);
      await loadOverview(token);
      setMessage("Video cargado y registrado en el inmueble.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar el video.");
      setMediaUploadProgress(null);
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
      request.ontimeout = () => reject(new Error("La carga demoro demasiado. Intenta con un video mas liviano o reintenta."));
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
              Contrasena
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
        aria-label="Cerrar menu"
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
        <div>
          <div className={styles.sidebarLogoWrap}>
            <img src="/LOGO_ASESPRO_transparente_horizontal.png?v=20260429b" alt="ASESPRO" className={styles.logoDesktop} />
            <img src="/LOGO_ASESPRO_transparente_horizontal_moible.png?v=20260429b" alt="ASESPRO" className={styles.logoMobile} />
          </div>
          <div className={styles.accountCard}>
            <span>Sesion activa</span>
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
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
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
              onPhotosChange={(files) => {
                setPhotoFiles(files);
                setCoverPhotoIndex(0);
                setMediaUploadProgress(null);
              }}
              onCoverPhotoChange={setCoverPhotoIndex}
              onVideoChange={(file) => {
                setVideoFile(file);
                setMediaUploadProgress(null);
              }}
            />
          </Modal>
        ) : null}

        {drawerMode === "publication" ? (
          <Modal onClose={() => setDrawerMode(null)}>
            <PublicationDrawer
              form={listingForm}
              busy={busy}
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
              mediaUploadProgress={mediaUploadProgress}
              coverPhotoIndex={coverPhotoIndex}
              videoFile={videoFile}
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
              onVideoChange={(file) => {
                setVideoFile(file);
                setMediaUploadProgress(null);
              }}
              onUploadVideo={() => void uploadSelectedPropertyVideo()}
              onDeleteMedia={(mediaId) => void deletePropertyMedia(propertyForm.id, mediaId)}
              onReorderMedia={(mediaType, orderedItems) => void reorderPropertyMedia(propertyForm.id, mediaType, orderedItems)}
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
      {cover?.public_url ? <img src={cover.public_url} alt="" /> : <span>Sin foto</span>}
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
          Crear publicacion
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
            <h3>Trabajo rapido</h3>
            <p>Acciones frecuentes para mantener la web al dia.</p>
          </div>
        </div>
        <div className={styles.quickActions}>
          <button type="button" onClick={onNewListing}>Crear publicacion</button>
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
          {listings.length === 0 ? <p className={styles.empty}>Todavia no hay publicaciones. Crea la primera para activar la web.</p> : null}
          {listings.length > 0 && mediaIssues.length === 0 ? <p className={styles.empty}>No hay alertas criticas de media.</p> : null}
        </div>
      </article>
      </section>
    </>
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
  onPhotosChange: (files: File[]) => void;
  onCoverPhotoChange: (index: number) => void;
  onVideoChange: (file: File | null) => void;
}): JSX.Element {
  const canContinueOwner = form.ownerMode === "new" ? form.newOwnerFullName.trim().length > 0 : form.ownerId.length > 0;
  const canContinueProperty = form.propertyMode === "new" ? form.street.trim().length > 0 && form.streetNumber.trim().length > 0 : form.propertyId.length > 0;
  const availableOperations = getAvailableOperations(form);

  return (
    <section className={styles.drawer} aria-label="Formulario de publicacion">
      <div className={styles.drawerHead}>
        <div>
          <h3>{form.id ? "Editar publicacion" : "Alta de inmueble y publicacion"}</h3>
          <p>El inmueble guarda la ficha y la media. La publicacion solo define como sale a la web.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose}>Cerrar</button>
      </div>

      <div className={styles.stepper} aria-label="Pasos de creacion">
        {[
          ["propietario", "1. Propietario"],
          ["inmueble", "2. Inmueble"],
          ["publicacion", "3. Publicacion"],
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
                  <label>Telefono<input value={form.newOwnerPhone} onChange={(event) => onChange({ ...form, newOwnerPhone: event.target.value })} /></label>
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
                  {properties.map((property) => <option key={property.id} value={property.id}>{property.title} - {property.location_text ?? "sin ubicacion"}</option>)}
                </select>
              </label>
            ) : null}
            <div className={styles.twoCols}>
              <label>Tipo<select value={form.propertyType} onChange={(event) => onChange({ ...form, propertyType: event.target.value as PropertyType })}><option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="terreno">Terreno</option></select></label>
              <label>Pais<input value={form.country} readOnly /></label>
            </div>
            {form.propertyMode === "new" ? (
              <>
                <div className={styles.twoCols}>
                  <label>Calle<input value={form.street} onChange={(event) => onChange({ ...form, street: event.target.value })} required /></label>
                  <label>Numero<input value={form.streetNumber} onChange={(event) => onChange({ ...form, streetNumber: event.target.value })} required /></label>
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
              <label>Direccion<input value={form.locationText} readOnly /></label>
            )}
            <div className={styles.threeCols}>
              <label>Dormitorios<input value={form.bedrooms} onChange={(event) => onChange({ ...form, bedrooms: event.target.value })} /></label>
              <label>Banos<input value={form.bathrooms} onChange={(event) => onChange({ ...form, bathrooms: event.target.value })} /></label>
              <label>m2<input value={form.areaM2} onChange={(event) => onChange({ ...form, areaM2: event.target.value })} /></label>
            </div>
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
            <label>Descripcion / ficha general<textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></label>
            <div className={styles.twoCols}>
              <label>Imagenes del inmueble<input type="file" accept="image/*" multiple onChange={(event) => onPhotosChange(Array.from(event.target.files ?? []))} /></label>
              <label>Video del inmueble<input type="file" accept="video/*" onChange={(event) => onVideoChange(event.target.files?.[0] ?? null)} /></label>
            </div>
            {photoFiles.length > 0 ? (
              <label>Imagen principal<select value={coverPhotoIndex} onChange={(event) => onCoverPhotoChange(Number(event.target.value))}>
                {photoFiles.map((file, index) => <option key={`${file.name}-${index}`} value={index}>{file.name}</option>)}
              </select></label>
            ) : null}
            {mediaUploadProgress ? <UploadProgress progress={mediaUploadProgress} /> : null}
            <div className={styles.formNav}>
              <button type="button" className={styles.secondaryLightButton} onClick={() => onStepChange("propietario")}>Volver</button>
              <button type="button" className={styles.primaryButton} disabled={!canContinueProperty} onClick={() => onStepChange("publicacion")}>Continuar a publicacion</button>
            </div>
          </div>
        ) : null}

        {step === "publicacion" ? (
          <div className={styles.formSection}>
          <h4>Publicacion</h4>
          {availableOperations.length === 0 ? <p className={styles.empty}>Activa venta o alquiler en el inmueble para poder crear una publicacion.</p> : null}
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
            <button type="submit" className={styles.primaryButton} disabled={busy || availableOperations.length === 0}>{busy ? "Publicando..." : "Crear publicacion"}</button>
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
  onClose,
  onSubmit,
  onChange,
  onToggleOperation,
}: {
  form: FormState;
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (form: FormState) => void;
  onToggleOperation: (operation: PropertyOperation) => void;
}): JSX.Element {
  const availableOperations = getPublicationOperations(form);
  return (
    <section className={styles.drawer} aria-label="Ficha de publicacion">
      <div className={styles.drawerHead}>
        <div>
          <h3>Editar publicacion</h3>
          <p>Ficha comercial visible en la web. La ficha del inmueble se edita desde Inmuebles.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose}>Cerrar</button>
      </div>
      <form className={styles.formPanel} onSubmit={onSubmit}>
        <div className={styles.twoCols}>
          <label>Estado<select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as PropertyStatus })}><option value="activo">Activo</option><option value="desactivado">Desactivado</option></select></label>
          <label>Inmueble<input value={form.title} readOnly /></label>
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
        <button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Guardando..." : "Guardar publicacion"}</button>
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
          <p>Ficha interna para contacto, seguimiento y vinculacion con inmuebles.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose}>Cerrar</button>
      </div>
      <form className={styles.formPanel} onSubmit={onSubmit}>
        <div className={styles.twoCols}>
          <label>Nombre completo<input value={form.fullName} onChange={(event) => onChange({ ...form, fullName: event.target.value })} required /></label>
          <label>Telefono<input value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} /></label>
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
  mediaUploadProgress,
  coverPhotoIndex,
  videoFile,
  currentMedia,
  hasPendingChanges,
  onClose,
  onSubmit,
  onChange,
  onPhotosChange,
  onCoverPhotoChange,
  onVideoChange,
  onUploadVideo,
  onDeleteMedia,
  onReorderMedia,
}: {
  form: PropertyFormState;
  busy: boolean;
  photoFiles: File[];
  mediaUploadProgress: MediaUploadProgress | null;
  coverPhotoIndex: number;
  videoFile: File | null;
  currentMedia: AdminMedia[];
  hasPendingChanges: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (form: PropertyFormState) => void;
  onPhotosChange: (files: File[]) => void;
  onCoverPhotoChange: (index: number) => void;
  onVideoChange: (file: File | null) => void;
  onUploadVideo: () => void;
  onDeleteMedia: (mediaId: string) => void;
  onReorderMedia: (mediaType: "photo" | "video", orderedItems: AdminMedia[]) => void;
}): JSX.Element {
  const sortedMedia = [...currentMedia].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const photoMedia = sortedMedia.filter((item) => item.media_type === "photo");
  const videoMedia = sortedMedia.filter((item) => item.media_type === "video");

  return (
    <section className={styles.drawer} aria-label="Formulario de inmueble">
      <div className={styles.drawerHead}>
        <div>
          <h3>Editar inmueble</h3>
          <p>Ficha interna del inmueble. El estado de publicacion se maneja en Publicaciones.</p>
        </div>
        <button type="button" className={styles.closeButton} aria-label="Cerrar" onClick={onClose}>x</button>
      </div>
      <form className={styles.formPanel} onSubmit={onSubmit}>
        <div className={styles.twoCols}>
          <label>Titulo<input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} required /></label>
          <label>Estado<select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as PropertyOperationalStatus })}><option value="disponible">Disponible</option><option value="alquilado">Alquilado</option><option value="vendido">Vendido</option></select></label>
        </div>
        <div className={styles.twoCols}>
          <label>Tipo<select value={form.propertyType} onChange={(event) => onChange({ ...form, propertyType: event.target.value as PropertyType })}><option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="terreno">Terreno</option></select></label>
          <label>Direccion<input value={form.locationText} onChange={(event) => onChange({ ...form, locationText: event.target.value })} required /></label>
        </div>
        <div className={styles.threeCols}>
          <label>Dormitorios<input value={form.bedrooms} onChange={(event) => onChange({ ...form, bedrooms: event.target.value })} /></label>
          <label>Banos<input value={form.bathrooms} onChange={(event) => onChange({ ...form, bathrooms: event.target.value })} /></label>
          <label>m2<input value={form.areaM2} onChange={(event) => onChange({ ...form, areaM2: event.target.value })} /></label>
        </div>
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
        <label>Descripcion<textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></label>
        <div className={styles.fileManager}>
          <div className={styles.fileManagerHead}>
            <strong>Archivos de la propiedad</strong>
            <span>{sortedMedia.length} archivos</span>
          </div>
          {sortedMedia.length > 0 ? (
            <div className={styles.fileSections}>
              <MediaSection title="Fotos" items={photoMedia} busy={busy} onDeleteMedia={onDeleteMedia} onReorder={(orderedItems) => onReorderMedia("photo", orderedItems)} />
              <MediaSection title="Videos" items={videoMedia} busy={busy} onDeleteMedia={onDeleteMedia} onReorder={(orderedItems) => onReorderMedia("video", orderedItems)} />
            </div>
          ) : (
            <p className={styles.empty}>Este inmueble todavia no tiene archivos cargados.</p>
          )}
        </div>
        <div className={styles.twoCols}>
          <label>Nuevas imagenes<input type="file" accept="image/*" multiple onChange={(event) => onPhotosChange(Array.from(event.target.files ?? []))} /></label>
          <label>Nuevo video<input type="file" accept="video/*" onChange={(event) => onVideoChange(event.target.files?.[0] ?? null)} /></label>
        </div>
        {photoFiles.length > 0 ? (
          <label>Imagen principal<select value={coverPhotoIndex} onChange={(event) => onCoverPhotoChange(Number(event.target.value))}>
            {photoFiles.map((file, index) => <option key={`${file.name}-${index}`} value={index}>{file.name}</option>)}
          </select></label>
        ) : null}
        {videoFile ? (
          <div className={styles.pendingVideoBox}>
            <div>
              <strong>Video seleccionado</strong>
              <span>{videoFile.name}</span>
            </div>
            <button type="button" className={styles.primaryButton} disabled={busy} onClick={onUploadVideo}>
              {busy ? "Cargando..." : "Cargar video"}
            </button>
          </div>
        ) : null}
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

function MediaSection({
  title,
  items,
  busy,
  onDeleteMedia,
  onReorder,
}: {
  title: string;
  items: AdminMedia[];
  busy: boolean;
  onDeleteMedia: (mediaId: string) => void;
  onReorder: (orderedItems: AdminMedia[]) => void;
}): JSX.Element {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <section className={styles.fileSection}>
      <div className={styles.fileSectionHead}>
        <strong>{title}</strong>
        <span>{items.length}</span>
      </div>
      {items.length > 0 ? (
        <div className={styles.fileGrid}>
          {items.map((item) => (
            <article
              key={item.id}
              className={`${styles.fileTile} ${draggingId === item.id ? styles.fileTileDragging : ""}`}
              draggable={!busy}
              onDragStart={() => setDraggingId(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (!draggingId || draggingId === item.id) return;
                onReorder(reorderMediaItems(items, draggingId, item.id));
                setDraggingId(null);
              }}
              onDragEnd={() => setDraggingId(null)}
            >
              <div className={styles.fileThumb}>
                {item.media_type === "video" && item.public_url ? (
                  <video src={item.public_url} controls preload="metadata" />
                ) : item.public_url ? (
                  <img src={item.public_url} alt="" />
                ) : (
                  <span>Sin vista</span>
                )}
                <small>{item.media_type === "video" ? "MP4" : item.is_cover ? "Principal" : "Foto"}</small>
              </div>
              <button type="button" className={styles.dangerButton} disabled={busy} onClick={() => onDeleteMedia(item.id)}>
                Eliminar
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Sin {title.toLowerCase()} cargados.</p>
      )}
    </section>
  );
}

function ListingTable({
  listings,
  busy,
  onEdit,
  onStatusChange,
  onFeaturedChange,
}: {
  listings: AdminListing[];
  busy: boolean;
  onEdit: (listing: AdminListing) => void;
  onStatusChange: (listing: AdminListing, status: PropertyStatus) => Promise<void>;
  onFeaturedChange: (listing: AdminListing, isFeatured: boolean) => Promise<void>;
}): JSX.Element {
  return (
    <section className={styles.tablePanel}>
      <div className={styles.sectionHead}>
        <div>
          <h3>Publicaciones</h3>
          <p>Controla que entra a la web, que queda pausado y que ya se cerro.</p>
        </div>
        <span>{listings.length}</span>
      </div>
      {listings.map((listing) => {
        const media = getListingMedia(listing);
        const photos = media.filter((item) => item.media_type === "photo").length;
        const hasVideo = media.some((item) => item.media_type === "video");
        return (
          <article key={listing.id} className={`${styles.rowCard} ${styles.rowCardWithMedia}`}>
            <MediaPreview media={media} />
            <div className={styles.rowMain}>
              <strong>{listing.title}</strong>
              <p>{listing.asespro_properties?.location_text ?? "Sin ubicacion"} - {operationLabel(listing.asespro_listing_operations)} - {formatMoney(listing.price_amount, listing.price_currency)}</p>
              <small>{photos} fotos - {hasVideo ? "con video" : "sin video"} - {listing.status}</small>
            </div>
            <div className={styles.rowActions}>
              <select value={listing.status} disabled={busy} onChange={(event) => void onStatusChange(listing, event.target.value as PropertyStatus)}>
                <option value="activo">Activo</option>
                <option value="desactivado">Desactivado</option>
              </select>
              <label className={styles.featuredToggle}>
                <input
                  type="checkbox"
                  checked={listing.is_featured === true}
                  disabled={busy}
                  onChange={(event) => void onFeaturedChange(listing, event.target.checked)}
                />
                Destacada
              </label>
              <button type="button" onClick={() => onEdit(listing)}>Editar</button>
            </div>
          </article>
        );
      })}
      {listings.length === 0 ? <p className={styles.empty}>No hay publicaciones para estos filtros.</p> : null}
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
          <p>Inventario fisico. El estado operativo no activa ni desactiva publicaciones.</p>
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
              <p>{property.location_text ?? "Sin ubicacion"} - {property.property_type}</p>
              <small>{property.bedrooms ?? "N/D"} dorm - {property.bathrooms ?? "N/D"} banos - {property.area_m2 ?? "N/D"} m2</small>
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
      {properties.length === 0 ? <p className={styles.empty}>Todavia no hay inmuebles cargados.</p> : null}
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
              <p>{owner.phone ?? "Sin telefono"} - {owner.email ?? "Sin email"}</p>
              <small>{linkedProperties.length > 0 ? linkedProperties.map((property) => property.title).join(" | ") : "Sin inmuebles vinculados"}</small>
            </div>
            <div className={styles.rowActions}>
              <span className={styles.statusMuted}>{linkedProperties.length} inmuebles</span>
              <button type="button" onClick={() => onEdit(owner)}>Editar</button>
            </div>
          </article>
        );
      })}
      {owners.length === 0 ? <p className={styles.empty}>Todavia no hay propietarios cargados.</p> : null}
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
