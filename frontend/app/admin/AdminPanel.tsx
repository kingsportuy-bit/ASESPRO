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

type PanelTab = "publicaciones" | "inmuebles" | "duenos" | "alquileres";

const EMPTY_FORM: FormState = {
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

function formatMoney(amount: number | null, currency: PropertyCurrency | null): string {
  if (typeof amount !== "number") return "Sin precio";
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function operationLabel(operations: Array<{ operation: PropertyOperation }>): string {
  const values = operations.map((item) => item.operation);
  if (values.includes("alquiler") && values.includes("venta")) return "Alquiler / Venta";
  return values[0] === "venta" ? "Venta" : "Alquiler";
}

export function AdminPanel(): JSX.Element {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [owners, setOwners] = useState<AdminOwner[]>([]);
  const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
  const [activeTab, setActiveTab] = useState<PanelTab>("publicaciones");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeListings = useMemo(() => listings.filter((listing) => listing.status === "activo"), [listings]);
  const inactiveListings = useMemo(() => listings.filter((listing) => listing.status !== "activo"), [listings]);

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
    await loadOverview(data.session.access_token);
  }

  async function logout(): Promise<void> {
    await supabase?.auth.signOut();
    setToken(null);
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

  function openNewListingForm(): void {
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setVideoFile(null);
    setShowForm(true);
    setActiveTab("publicaciones");
    setMessage(null);
  }

  function toggleOperation(operation: PropertyOperation): void {
    setForm((current) => {
      const exists = current.operations.includes(operation);
      const operations = exists ? current.operations.filter((item) => item !== operation) : [...current.operations, operation];
      const nextOperations = operations.length > 0 ? operations : [operation];
      return {
        ...current,
        operations: nextOperations,
        priceCurrency: nextOperations.includes("alquiler") ? "UYU" : "USD",
      };
    });
  }

  function editListing(listing: AdminListing): void {
    const operations = listing.asespro_listing_operations.map((item) => item.operation);
    setForm({
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
      priceCurrency: listing.price_currency ?? (operations.includes("alquiler") ? "UYU" : "USD"),
      operations: operations.length > 0 ? operations : ["alquiler"],
      status: listing.status,
    });
    setShowForm(true);
    setActiveTab("publicaciones");
    setMessage("Editando publicacion existente.");
  }

  async function saveListing(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setMessage(null);

    const body = {
      title: form.title,
      description: form.description,
      propertyType: form.propertyType,
      locationText: form.locationText,
      latitude: form.latitude,
      longitude: form.longitude,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      areaM2: form.areaM2,
      priceAmount: form.priceAmount,
      priceCurrency: form.priceCurrency,
      operations: form.operations,
      status: form.status,
    };
    const response = await fetch(form.id ? `/api/admin/listings/${form.id}` : "/api/admin/listings", {
      method: form.id ? "PUT" : "POST",
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
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setVideoFile(null);
    setShowForm(false);
    await loadOverview(token);
    setBusy(false);
    setMessage("Publicacion guardada.");
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
          <span className={styles.adminMark}>ASESPRO Backoffice</span>
          <h1>Panel interno</h1>
          <p>Ingresar para gestionar publicaciones, inmuebles y fichas internas.</p>
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

  return (
    <main className={styles.appShell} data-admin-shell="true">
      <aside className={styles.sidebar}>
        <div>
          <span className={styles.adminMark}>ASESPRO</span>
          <h1>Panel interno</h1>
        </div>
        <nav className={styles.sideNav} aria-label="Secciones del panel">
          <button className={activeTab === "publicaciones" ? styles.activeNav : ""} type="button" onClick={() => setActiveTab("publicaciones")}>
            Publicaciones
          </button>
          <button className={activeTab === "inmuebles" ? styles.activeNav : ""} type="button" onClick={() => setActiveTab("inmuebles")}>
            Inmuebles
          </button>
          <button className={activeTab === "duenos" ? styles.activeNav : ""} type="button" onClick={() => setActiveTab("duenos")}>
            Duenos
          </button>
          <button className={activeTab === "alquileres" ? styles.activeNav : ""} type="button" onClick={() => setActiveTab("alquileres")}>
            Alquileres activos
          </button>
        </nav>
        <button type="button" className={styles.secondaryButton} onClick={logout}>
          Salir
        </button>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topBar}>
          <div>
            <p className={styles.kicker}>Gestion diaria</p>
            <h2>Propiedades, duenos y publicaciones</h2>
          </div>
          <button type="button" className={styles.primaryButton} onClick={openNewListingForm}>
            Nueva publicacion
          </button>
        </header>

        {message ? <p className={styles.notice}>{message}</p> : null}

        <section className={styles.metrics} aria-label="Resumen operativo">
          <article>
            <span>Publicaciones activas</span>
            <strong>{activeListings.length}</strong>
          </article>
          <article>
            <span>Inmuebles activos</span>
            <strong>{properties.filter((property) => property.is_active).length}</strong>
          </article>
          <article>
            <span>Fichas de duenos</span>
            <strong>{owners.length}</strong>
          </article>
          <article>
            <span>Alquileres activos</span>
            <strong>{activeRentals.length}</strong>
          </article>
        </section>

        {showForm ? (
          <section className={styles.drawer} aria-label="Formulario de publicacion">
            <div className={styles.drawerHead}>
              <div>
                <h3>{form.id ? "Editar publicacion" : "Crear nueva publicacion"}</h3>
                <p>Las fotos y videos se suben a Supabase Storage y quedan vinculados a esta publicacion.</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setShowForm(false)}>
                Cerrar
              </button>
            </div>

            <form className={styles.formPanel} onSubmit={saveListing}>
              <label>
                Titulo
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              </label>
              <label>
                Descripcion
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>
              <div className={styles.twoCols}>
                <label>
                  Tipo
                  <select value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value as PropertyType })}>
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="terreno">Terreno</option>
                  </select>
                </label>
                <label>
                  Estado
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PropertyStatus })}>
                    <option value="desactivado">Desactivado</option>
                    <option value="activo">Activo</option>
                    <option value="alquilado">Alquilado</option>
                    <option value="vendido">Vendido</option>
                  </select>
                </label>
              </div>
              <label>
                Ubicacion
                <input value={form.locationText} onChange={(event) => setForm({ ...form, locationText: event.target.value })} required />
              </label>
              <div className={styles.twoCols}>
                <label>
                  Latitud
                  <input value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} required />
                </label>
                <label>
                  Longitud
                  <input value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} required />
                </label>
              </div>
              <div className={styles.threeCols}>
                <label>
                  Dormitorios
                  <input value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} />
                </label>
                <label>
                  Banos
                  <input value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} />
                </label>
                <label>
                  m2
                  <input value={form.areaM2} onChange={(event) => setForm({ ...form, areaM2: event.target.value })} />
                </label>
              </div>
              <div className={styles.operations}>
                <label>
                  <input type="checkbox" checked={form.operations.includes("alquiler")} onChange={() => toggleOperation("alquiler")} /> Alquiler
                </label>
                <label>
                  <input type="checkbox" checked={form.operations.includes("venta")} onChange={() => toggleOperation("venta")} /> Venta
                </label>
              </div>
              <div className={styles.twoCols}>
                <label>
                  Precio
                  <input value={form.priceAmount} onChange={(event) => setForm({ ...form, priceAmount: event.target.value })} />
                </label>
                <label>
                  Moneda
                  <select value={form.priceCurrency} onChange={(event) => setForm({ ...form, priceCurrency: event.target.value as PropertyCurrency })}>
                    <option value="UYU">Pesos uruguayos</option>
                    <option value="USD">Dolares</option>
                  </select>
                </label>
              </div>
              <div className={styles.twoCols}>
                <label>
                  Fotos
                  <input type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} />
                </label>
                <label>
                  Video
                  <input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)} />
                </label>
              </div>
              <button type="submit" className={styles.primaryButton} disabled={busy}>
                {busy ? "Guardando..." : "Guardar publicacion"}
              </button>
            </form>
          </section>
        ) : null}

        {activeTab === "publicaciones" ? (
          <section className={styles.panelGrid}>
            <AdminList title="Activas" listings={activeListings} onEdit={editListing} />
            <AdminList title="Pendientes / cerradas" listings={inactiveListings} onEdit={editListing} />
          </section>
        ) : null}

        {activeTab === "inmuebles" ? (
          <section className={styles.tablePanel}>
            {properties.map((property) => (
              <article key={property.id} className={styles.rowCard}>
                <div>
                  <strong>{property.title}</strong>
                  <p>{property.location_text ?? "Sin ubicacion"} - {property.property_type}</p>
                </div>
                <span className={property.is_active ? styles.statusActive : styles.statusMuted}>{property.is_active ? "Activo" : "Inactivo"}</span>
              </article>
            ))}
            {properties.length === 0 ? <p className={styles.empty}>Todavia no hay inmuebles cargados.</p> : null}
          </section>
        ) : null}

        {activeTab === "duenos" ? (
          <section className={styles.tablePanel}>
            {owners.map((owner) => (
              <article key={owner.id} className={styles.rowCard}>
                <div>
                  <strong>{owner.full_name}</strong>
                  <p>{owner.phone ?? "Sin telefono"} - {owner.email ?? "Sin email"}</p>
                </div>
                <span className={styles.statusMuted}>Ficha</span>
              </article>
            ))}
            {owners.length === 0 ? <p className={styles.empty}>Todavia no hay fichas de duenos cargadas.</p> : null}
          </section>
        ) : null}

        {activeTab === "alquileres" ? (
          <section className={styles.tablePanel}>
            {activeRentals.map((rental) => (
              <article key={rental.id} className={styles.rowCard}>
                <div>
                  <strong>{formatMoney(rental.monthly_price, "UYU")}</strong>
                  <p>Inicio {rental.start_date} - {rental.end_date ?? "sin fecha de fin"}</p>
                </div>
                <span className={styles.statusActive}>{rental.status}</span>
              </article>
            ))}
            {activeRentals.length === 0 ? <p className={styles.empty}>No hay alquileres activos cargados.</p> : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function AdminList({
  title,
  listings,
  onEdit,
}: {
  title: string;
  listings: AdminListing[];
  onEdit: (listing: AdminListing) => void;
}): JSX.Element {
  return (
    <section className={styles.tablePanel}>
      <div className={styles.sectionHead}>
        <h3>{title}</h3>
        <span>{listings.length}</span>
      </div>
      {listings.map((listing) => {
        const photos = listing.asespro_listing_media.filter((item) => item.media_type === "photo").length;
        const hasVideo = listing.asespro_listing_media.some((item) => item.media_type === "video");
        return (
          <article key={listing.id} className={styles.rowCard}>
            <div>
              <strong>{listing.title}</strong>
              <p>
                {listing.asespro_properties?.location_text ?? "Sin ubicacion"} - {operationLabel(listing.asespro_listing_operations)} -{" "}
                {formatMoney(listing.price_amount, listing.price_currency)}
              </p>
              <small>{photos} fotos - {hasVideo ? "con video" : "sin video"}</small>
            </div>
            <div className={styles.rowActions}>
              <span className={listing.status === "activo" ? styles.statusActive : styles.statusMuted}>{listing.status}</span>
              <button type="button" onClick={() => onEdit(listing)}>
                Editar
              </button>
            </div>
          </article>
        );
      })}
      {listings.length === 0 ? <p className={styles.empty}>Sin registros en esta seccion.</p> : null}
    </section>
  );
}
