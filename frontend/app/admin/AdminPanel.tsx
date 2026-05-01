"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { PropertyCurrency, PropertyOperation, PropertyStatus, PropertyType } from "@/lib/properties";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

import styles from "./AdminPanel.module.css";

type AdminListing = {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  price_amount: number | null;
  price_currency: PropertyCurrency | null;
  status: PropertyStatus;
  created_at?: string;
  asespro_properties: {
    property_type: PropertyType;
    location_text: string | null;
    latitude: number | null;
    longitude: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    area_m2: number | null;
  } | null;
  asespro_listing_operations: Array<{ operation: PropertyOperation }>;
  asespro_listing_media: Array<{ id: string; media_type: "photo" | "video"; public_url: string | null; is_cover?: boolean | null; sort_order?: number | null }>;
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
  asespro_property_owners?: Array<{ owner_id: string }>;
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
  priceAmount: string;
  priceCurrency: PropertyCurrency;
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
};

type PanelTab = "resumen" | "publicaciones" | "inmuebles" | "propietarios" | "alquileres";
type DrawerMode = "listing" | "owner" | "property" | null;
type ListingFilter = "todos" | PropertyStatus;
type ListingWizardStep = "propietario" | "inmueble" | "publicacion";

const EMPTY_LISTING_FORM: FormState = {
  id: null,
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
  priceAmount: "",
  priceCurrency: "UYU",
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
  const photos = listing.asespro_listing_media.filter((item) => item.media_type === "photo").length;
  const hasVideo = listing.asespro_listing_media.some((item) => item.media_type === "video");
  return photos === 0 || !hasVideo;
}

function matchesSearch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

function buildAddress(form: FormState): string {
  const streetLine = [form.street.trim(), form.streetNumber.trim()].filter(Boolean).join(" ");
  return [streetLine, form.city, form.department, form.country].filter(Boolean).join(", ");
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
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [listingFilter, setListingFilter] = useState<ListingFilter>("todos");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const exists = current.operations.includes(operation);
      const operations = exists ? current.operations.filter((item) => item !== operation) : [...current.operations, operation];
      const nextOperations = operations.length > 0 ? operations : [operation];
      return { ...current, operations: nextOperations };
    });
  }

  function selectPropertyForListing(propertyId: string): void {
    const property = properties.find((item) => item.id === propertyId);
    if (!property) {
      setListingForm((current) => ({ ...current, propertyId }));
      return;
    }

    setListingForm((current) => ({
      ...current,
      propertyId,
      ownerId: property.asespro_property_owners?.[0]?.owner_id ?? current.ownerId,
      title: current.title || property.title,
      description: current.description || property.description || "",
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
    }));
  }

  function editListing(listing: AdminListing): void {
    const operations = listing.asespro_listing_operations.map((item) => item.operation);
    const linkedProperty = properties.find((property) => property.id === listing.property_id);
    setListingForm({
      id: listing.id,
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
      priceAmount: listing.price_amount?.toString() ?? "",
      priceCurrency: listing.price_currency ?? "USD",
      operations: operations.length > 0 ? operations : ["alquiler"],
      status: listing.status,
    });
    setWizardStep("publicacion");
    setDrawerMode("listing");
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
    setPropertyForm({
      id: property.id,
      title: property.title,
      description: property.description ?? "",
      propertyType: property.property_type,
      locationText: property.location_text ?? "",
      bedrooms: property.bedrooms?.toString() ?? "",
      bathrooms: property.bathrooms?.toString() ?? "",
      areaM2: property.area_m2?.toString() ?? "",
      status: property.status ?? "disponible",
    });
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
      priceAmount: listingForm.priceAmount,
      priceCurrency: listingForm.priceCurrency,
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
    const payload = (await response.json()) as { id?: string; error?: string };

    if (!response.ok || !payload.id) {
      setBusy(false);
      setMessage(payload.error ?? "No se pudo guardar.");
      return;
    }

    await uploadMedia(payload.id);
    setListingForm(EMPTY_LISTING_FORM);
    setPhotoFiles([]);
    setCoverPhotoIndex(0);
    setVideoFile(null);
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

  async function saveProperty(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !propertyForm.id) return;
    setBusy(true);
    setMessage(null);

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
      setMessage(payload.error ?? "No se pudo actualizar el inmueble.");
      return;
    }

    setPropertyForm(EMPTY_PROPERTY_FORM);
    setDrawerMode(null);
    await loadOverview(token);
    setBusy(false);
    setMessage("Inmueble actualizado.");
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

  async function uploadMedia(listingId: string): Promise<void> {
    if (!token) return;
    for (const [index, file] of photoFiles.entries()) {
      const data = new FormData();
      data.set("file", file);
      data.set("mediaType", "photo");
      data.set("isCover", index === coverPhotoIndex ? "true" : "false");
      await fetch(`/api/admin/listings/${listingId}/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
    }

    for (const item of [{ file: videoFile, mediaType: "video" }] as const) {
      if (!item.file) continue;
      const data = new FormData();
      data.set("file", item.file);
      data.set("mediaType", item.mediaType);
      data.set("isCover", "false");
      await fetch(`/api/admin/listings/${listingId}/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
    }
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
              coverPhotoIndex={coverPhotoIndex}
              onPhotosChange={(files) => {
                setPhotoFiles(files);
                setCoverPhotoIndex(0);
              }}
              onCoverPhotoChange={setCoverPhotoIndex}
              onVideoChange={setVideoFile}
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
            <PropertyDrawer form={propertyForm} busy={busy} onClose={() => setDrawerMode(null)} onSubmit={saveProperty} onChange={setPropertyForm} />
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
          <ListingTable listings={filteredListings} busy={busy} onEdit={editListing} onStatusChange={updateListingStatus} />
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

function MediaPreview({ media }: { media: AdminListing["asespro_listing_media"] }): JSX.Element {
  const photos = media.filter((item) => item.media_type === "photo" && item.public_url).sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const cover = photos[0];
  const video = media.find((item) => item.media_type === "video" && item.public_url);

  return (
    <div className={styles.mediaPreview}>
      {cover?.public_url ? <img src={cover.public_url} alt="" /> : <span>Sin foto</span>}
      {video?.public_url ? <video src={video.public_url} muted playsInline preload="metadata" /> : null}
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
  coverPhotoIndex: number;
  onPhotosChange: (files: File[]) => void;
  onCoverPhotoChange: (index: number) => void;
  onVideoChange: (file: File | null) => void;
}): JSX.Element {
  const canContinueOwner = form.ownerMode === "new" ? form.newOwnerFullName.trim().length > 0 : form.ownerId.length > 0;
  const canContinueProperty = form.propertyMode === "new" ? form.street.trim().length > 0 && form.streetNumber.trim().length > 0 : form.propertyId.length > 0;

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
            <div className={styles.twoCols}>
              <label>Precio base del inmueble<input inputMode="decimal" value={form.priceAmount} onChange={(event) => onChange({ ...form, priceAmount: event.target.value })} /></label>
              <label>Moneda base<input list="admin-currencies" value={form.priceCurrency} onChange={(event) => onChange({ ...form, priceCurrency: event.target.value.toUpperCase() })} /><datalist id="admin-currencies"><option value="UYU" /><option value="USD" /><option value="EUR" /></datalist></label>
            </div>
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
            <div className={styles.formNav}>
              <button type="button" className={styles.secondaryLightButton} onClick={() => onStepChange("propietario")}>Volver</button>
              <button type="button" className={styles.primaryButton} disabled={!canContinueProperty} onClick={() => onStepChange("publicacion")}>Continuar a publicacion</button>
            </div>
          </div>
        ) : null}

        {step === "publicacion" ? (
          <div className={styles.formSection}>
          <h4>Publicacion</h4>
          <div className={styles.operations}>
            <label><input type="checkbox" checked={form.operations.includes("alquiler")} onChange={() => onToggleOperation("alquiler")} /> Alquiler</label>
            <label><input type="checkbox" checked={form.operations.includes("venta")} onChange={() => onToggleOperation("venta")} /> Venta</label>
          </div>
          <div className={styles.twoCols}>
            <label>Precio a publicar<input inputMode="decimal" value={form.priceAmount} onChange={(event) => onChange({ ...form, priceAmount: event.target.value })} /></label>
            <label>Moneda a publicar<input list="admin-currencies" value={form.priceCurrency} onChange={(event) => onChange({ ...form, priceCurrency: event.target.value.toUpperCase() })} /></label>
          </div>
          <div className={styles.formNav}>
            <button type="button" className={styles.secondaryLightButton} onClick={() => onStepChange("inmueble")}>Volver</button>
            <button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Publicando..." : "Crear publicacion"}</button>
          </div>
        </div>
        ) : null}

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
  onClose,
  onSubmit,
  onChange,
}: {
  form: PropertyFormState;
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (form: PropertyFormState) => void;
}): JSX.Element {
  return (
    <section className={styles.drawer} aria-label="Formulario de inmueble">
      <div className={styles.drawerHead}>
        <div>
          <h3>Editar inmueble</h3>
          <p>Ficha interna del inmueble. El estado de publicacion se maneja en Publicaciones.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose}>Cerrar</button>
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
        <label>Descripcion<textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></label>
        <button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Guardando..." : "Guardar inmueble"}</button>
      </form>
    </section>
  );
}

function ListingTable({
  listings,
  busy,
  onEdit,
  onStatusChange,
}: {
  listings: AdminListing[];
  busy: boolean;
  onEdit: (listing: AdminListing) => void;
  onStatusChange: (listing: AdminListing, status: PropertyStatus) => Promise<void>;
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
        const photos = listing.asespro_listing_media.filter((item) => item.media_type === "photo").length;
        const hasVideo = listing.asespro_listing_media.some((item) => item.media_type === "video");
        return (
          <article key={listing.id} className={`${styles.rowCard} ${styles.rowCardWithMedia}`}>
            <MediaPreview media={listing.asespro_listing_media} />
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
        const media = propertyListings.flatMap((listing) => listing.asespro_listing_media);
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
