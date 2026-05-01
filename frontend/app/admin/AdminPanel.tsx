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
  asespro_listing_media: Array<{ id: string; media_type: "photo" | "video"; public_url: string | null }>;
};

type AdminProperty = {
  id: string;
  code: string | null;
  title: string;
  property_type: PropertyType;
  location_text: string | null;
  is_active: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
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
  title: string;
  description: string;
  propertyType: PropertyType;
  locationText: string;
  latitude: string;
  longitude: string;
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

type PanelTab = "resumen" | "publicaciones" | "inmuebles" | "propietarios" | "alquileres";
type DrawerMode = "listing" | "owner" | null;
type ListingFilter = "todos" | PropertyStatus;

const EMPTY_LISTING_FORM: FormState = {
  id: null,
  title: "",
  description: "",
  propertyType: "casa",
  locationText: "",
  latitude: "",
  longitude: "",
  bedrooms: "",
  bathrooms: "",
  areaM2: "",
  priceAmount: "",
  priceCurrency: "UYU",
  operations: ["alquiler"],
  status: "desactivado",
};

const EMPTY_OWNER_FORM: OwnerFormState = {
  id: null,
  fullName: "",
  phone: "",
  email: "",
  notes: "",
};

const NAV_ITEMS: Array<{ id: PanelTab; label: string; hint: string }> = [
  { id: "resumen", label: "Resumen", hint: "Estado operativo" },
  { id: "publicaciones", label: "Publicaciones", hint: "Web y estados" },
  { id: "inmuebles", label: "Inmuebles", hint: "Stock interno" },
  { id: "propietarios", label: "Propietarios", hint: "Fichas y contacto" },
  { id: "alquileres", label: "Alquileres", hint: "Contratos activos" },
];

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
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [listingForm, setListingForm] = useState<FormState>(EMPTY_LISTING_FORM);
  const [ownerForm, setOwnerForm] = useState<OwnerFormState>(EMPTY_OWNER_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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

  function openNewListingForm(): void {
    setListingForm(EMPTY_LISTING_FORM);
    setPhotoFile(null);
    setVideoFile(null);
    setDrawerMode("listing");
    setActiveTab("publicaciones");
    setMessage(null);
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

  function editListing(listing: AdminListing): void {
    const operations = listing.asespro_listing_operations.map((item) => item.operation);
    setListingForm({
      id: listing.id,
      title: listing.title,
      description: listing.description ?? "",
      propertyType: listing.asespro_properties?.property_type ?? "casa",
      locationText: listing.asespro_properties?.location_text ?? "",
      latitude: listing.asespro_properties?.latitude?.toString() ?? "",
      longitude: listing.asespro_properties?.longitude?.toString() ?? "",
      bedrooms: listing.asespro_properties?.bedrooms?.toString() ?? "",
      bathrooms: listing.asespro_properties?.bathrooms?.toString() ?? "",
      areaM2: listing.asespro_properties?.area_m2?.toString() ?? "",
      priceAmount: listing.price_amount?.toString() ?? "",
      priceCurrency: listing.price_currency ?? "USD",
      operations: operations.length > 0 ? operations : ["alquiler"],
      status: listing.status,
    });
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

  async function saveListing(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setMessage(null);

    const body = {
      title: listingForm.title,
      description: listingForm.description,
      propertyType: listingForm.propertyType,
      locationText: listingForm.locationText,
      latitude: listingForm.latitude,
      longitude: listingForm.longitude,
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
    setPhotoFile(null);
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
    for (const item of [
      { file: photoFile, mediaType: "photo" },
      { file: videoFile, mediaType: "video" },
    ] as const) {
      if (!item.file) continue;
      const data = new FormData();
      data.set("file", item.file);
      data.set("mediaType", item.mediaType);
      data.set("isCover", item.mediaType === "photo" ? "true" : "false");
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

  return (
    <main className={styles.appShell} data-admin-shell="true">
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
            <p className={styles.kicker}>Panel de administracion</p>
            <h2>{title}</h2>
            <span>Gestion diaria de la web y operacion inmobiliaria.</span>
          </div>
          <div className={styles.topActions}>
            <button type="button" className={styles.secondaryLightButton} onClick={() => void loadOverview()}>
              Actualizar
            </button>
            <button type="button" className={styles.primaryButton} onClick={openNewListingForm}>
              Nueva publicacion
            </button>
          </div>
        </header>

        {message ? <p className={styles.notice}>{message}</p> : null}

        <section className={styles.metrics} aria-label="Resumen operativo">
          <Metric label="Publicaciones activas" value={activeListings.length} hint={`${listings.length} totales`} />
          <Metric label="Stock activo" value={properties.filter((property) => property.is_active).length} hint={`${inactiveProperties.length} inactivos`} />
          <Metric label="Propietarios" value={owners.length} hint="fichas internas" />
          <Metric label="Alertas" value={mediaIssues.length} hint="sin media completa" tone={mediaIssues.length > 0 ? "warn" : "ok"} />
        </section>

        {drawerMode === "listing" ? (
          <ListingDrawer
            form={listingForm}
            busy={busy}
            onClose={() => setDrawerMode(null)}
            onSubmit={saveListing}
            onChange={setListingForm}
            onToggleOperation={toggleOperation}
            onPhotoChange={setPhotoFile}
            onVideoChange={setVideoFile}
          />
        ) : null}

        {drawerMode === "owner" ? (
          <OwnerDrawer form={ownerForm} busy={busy} onClose={() => setDrawerMode(null)} onSubmit={saveOwner} onChange={setOwnerForm} />
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
            {activeTab === "propietarios" ? (
              <button type="button" className={styles.primaryButton} onClick={openNewOwnerForm}>
                Nuevo propietario
              </button>
            ) : null}
          </section>
        ) : null}

        {activeTab === "resumen" ? (
          <Dashboard
            listings={listings}
            properties={properties}
            owners={owners}
            activeRentals={activeRentals}
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
          <PropertyTable properties={filteredProperties} busy={busy} onToggleActive={updatePropertyActive} />
        ) : null}

        {activeTab === "propietarios" ? <OwnerTable owners={filteredOwners} onEdit={editOwner} /> : null}

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

function Dashboard({
  listings,
  properties,
  owners,
  activeRentals,
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
  pricedListings: number;
  mediaIssues: AdminListing[];
  onNewListing: () => void;
  onNewOwner: () => void;
  onSelectTab: (tab: PanelTab) => void;
}): JSX.Element {
  return (
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
  );
}

function ListingDrawer({
  form,
  busy,
  onClose,
  onSubmit,
  onChange,
  onToggleOperation,
  onPhotoChange,
  onVideoChange,
}: {
  form: FormState;
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: (form: FormState) => void;
  onToggleOperation: (operation: PropertyOperation) => void;
  onPhotoChange: (file: File | null) => void;
  onVideoChange: (file: File | null) => void;
}): JSX.Element {
  return (
    <section className={styles.drawer} aria-label="Formulario de publicacion">
      <div className={styles.drawerHead}>
        <div>
          <h3>{form.id ? "Editar publicacion" : "Crear publicacion"}</h3>
          <p>Publicacion comercial + ficha tecnica del inmueble. La media se guarda en Supabase Storage.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose}>Cerrar</button>
      </div>

      <form className={styles.formPanel} onSubmit={onSubmit}>
        <div className={styles.formSection}>
          <h4>Datos comerciales</h4>
          <div className={styles.twoCols}>
            <label>Titulo<input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} required /></label>
            <label>Estado<select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as PropertyStatus })}><option value="desactivado">Desactivado</option><option value="activo">Activo</option><option value="alquilado">Alquilado</option><option value="vendido">Vendido</option></select></label>
          </div>
          <label>Descripcion<textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></label>
          <div className={styles.operations}>
            <label><input type="checkbox" checked={form.operations.includes("alquiler")} onChange={() => onToggleOperation("alquiler")} /> Alquiler</label>
            <label><input type="checkbox" checked={form.operations.includes("venta")} onChange={() => onToggleOperation("venta")} /> Venta</label>
          </div>
          <div className={styles.twoCols}>
            <label>Precio<input inputMode="decimal" value={form.priceAmount} onChange={(event) => onChange({ ...form, priceAmount: event.target.value })} /></label>
            <label>Moneda<input list="admin-currencies" value={form.priceCurrency} onChange={(event) => onChange({ ...form, priceCurrency: event.target.value.toUpperCase() })} /><datalist id="admin-currencies"><option value="UYU" /><option value="USD" /><option value="EUR" /></datalist></label>
          </div>
        </div>

        <div className={styles.formSection}>
          <h4>Inmueble</h4>
          <div className={styles.twoCols}>
            <label>Tipo<select value={form.propertyType} onChange={(event) => onChange({ ...form, propertyType: event.target.value as PropertyType })}><option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="terreno">Terreno</option></select></label>
            <label>Ubicacion<input value={form.locationText} onChange={(event) => onChange({ ...form, locationText: event.target.value })} required /></label>
          </div>
          <div className={styles.twoCols}>
            <label>Latitud<input value={form.latitude} onChange={(event) => onChange({ ...form, latitude: event.target.value })} required /></label>
            <label>Longitud<input value={form.longitude} onChange={(event) => onChange({ ...form, longitude: event.target.value })} required /></label>
          </div>
          <div className={styles.threeCols}>
            <label>Dormitorios<input value={form.bedrooms} onChange={(event) => onChange({ ...form, bedrooms: event.target.value })} /></label>
            <label>Banos<input value={form.bathrooms} onChange={(event) => onChange({ ...form, bathrooms: event.target.value })} /></label>
            <label>m2<input value={form.areaM2} onChange={(event) => onChange({ ...form, areaM2: event.target.value })} /></label>
          </div>
        </div>

        <div className={styles.formSection}>
          <h4>Media</h4>
          <div className={styles.twoCols}>
            <label>Foto principal<input type="file" accept="image/*" onChange={(event) => onPhotoChange(event.target.files?.[0] ?? null)} /></label>
            <label>Video<input type="file" accept="video/*" onChange={(event) => onVideoChange(event.target.files?.[0] ?? null)} /></label>
          </div>
        </div>

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
          <article key={listing.id} className={styles.rowCard}>
            <div className={styles.rowMain}>
              <strong>{listing.title}</strong>
              <p>{listing.asespro_properties?.location_text ?? "Sin ubicacion"} - {operationLabel(listing.asespro_listing_operations)} - {formatMoney(listing.price_amount, listing.price_currency)}</p>
              <small>{photos} fotos - {hasVideo ? "con video" : "sin video"} - {listing.status}</small>
            </div>
            <div className={styles.rowActions}>
              <select value={listing.status} disabled={busy} onChange={(event) => void onStatusChange(listing, event.target.value as PropertyStatus)}>
                <option value="activo">Activo</option>
                <option value="desactivado">Desactivado</option>
                <option value="alquilado">Alquilado</option>
                <option value="vendido">Vendido</option>
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
  busy,
  onToggleActive,
}: {
  properties: AdminProperty[];
  busy: boolean;
  onToggleActive: (property: AdminProperty, isActive: boolean) => Promise<void>;
}): JSX.Element {
  return (
    <section className={styles.tablePanel}>
      <div className={styles.sectionHead}>
        <div>
          <h3>Inmuebles</h3>
          <p>Inventario fisico. Activar o desactivar aca afecta el stock interno disponible.</p>
        </div>
        <span>{properties.length}</span>
      </div>
      {properties.map((property) => (
        <article key={property.id} className={styles.rowCard}>
          <div className={styles.rowMain}>
            <strong>{property.title}</strong>
            <p>{property.location_text ?? "Sin ubicacion"} - {property.property_type}</p>
            <small>{property.bedrooms ?? "N/D"} dorm - {property.bathrooms ?? "N/D"} banos - {property.area_m2 ?? "N/D"} m2</small>
          </div>
          <div className={styles.rowActions}>
            <span className={property.is_active ? styles.statusActive : styles.statusMuted}>{property.is_active ? "Activo" : "Inactivo"}</span>
            <button type="button" disabled={busy} onClick={() => void onToggleActive(property, !property.is_active)}>
              {property.is_active ? "Desactivar" : "Activar"}
            </button>
          </div>
        </article>
      ))}
      {properties.length === 0 ? <p className={styles.empty}>Todavia no hay inmuebles cargados.</p> : null}
    </section>
  );
}

function OwnerTable({ owners, onEdit }: { owners: AdminOwner[]; onEdit: (owner: AdminOwner) => void }): JSX.Element {
  return (
    <section className={styles.tablePanel}>
      <div className={styles.sectionHead}>
        <div>
          <h3>Propietarios</h3>
          <p>Fichas de contacto para operar inmuebles sin depender de memoria o planillas externas.</p>
        </div>
        <span>{owners.length}</span>
      </div>
      {owners.map((owner) => (
        <article key={owner.id} className={styles.rowCard}>
          <div className={styles.rowMain}>
            <strong>{owner.full_name}</strong>
            <p>{owner.phone ?? "Sin telefono"} - {owner.email ?? "Sin email"}</p>
            <small>{owner.notes || "Sin notas internas"}</small>
          </div>
          <div className={styles.rowActions}>
            <span className={styles.statusMuted}>Ficha</span>
            <button type="button" onClick={() => onEdit(owner)}>Editar</button>
          </div>
        </article>
      ))}
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
