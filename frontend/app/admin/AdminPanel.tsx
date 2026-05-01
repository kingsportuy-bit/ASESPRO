"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import type { PropertyCurrency, PropertyOperation, PropertyStatus, PropertyType } from "@/lib/properties";

import styles from "./AdminPanel.module.css";

type AdminListing = {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  price_amount: number | null;
  price_currency: PropertyCurrency | null;
  status: PropertyStatus;
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

export function AdminPanel(): JSX.Element {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token ?? null;
      setToken(accessToken);
      if (accessToken) void loadListings(accessToken);
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
    await loadListings(data.session.access_token);
  }

  async function loadListings(accessToken = token): Promise<void> {
    if (!accessToken) return;
    const response = await fetch("/api/admin/listings", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = (await response.json()) as { data?: AdminListing[]; error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "No se pudieron cargar las publicaciones.");
      return;
    }
    setListings(payload.data ?? []);
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
    await loadListings(token);
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
      <main className={styles.shell}>
        <section className={styles.loginCard}>
          <h1>Panel ASESPRO</h1>
          <p>Ingresar con usuario autorizado de Supabase.</p>
          <form className={styles.form} onSubmit={login}>
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Contrasena<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {message ? <p className={styles.alert}>{message}</p> : null}
            <button type="submit" disabled={busy}>{busy ? "Ingresando..." : "Ingresar"}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.header}>
        <div>
          <h1>Publicaciones</h1>
          <p>Crear, editar y activar fichas visibles en la web.</p>
        </div>
        <button type="button" onClick={() => setForm(EMPTY_FORM)}>Nueva publicacion</button>
      </section>

      {message ? <p className={styles.notice}>{message}</p> : null}

      <section className={styles.grid}>
        <form className={styles.formPanel} onSubmit={saveListing}>
          <h2>{form.id ? "Editar publicacion" : "Nueva publicacion"}</h2>
          <label>Titulo<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
          <label>Descripcion<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <div className={styles.twoCols}>
            <label>Tipo<select value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value as PropertyType })}><option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="terreno">Terreno</option></select></label>
            <label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PropertyStatus })}><option value="desactivado">Desactivado</option><option value="activo">Activo</option><option value="alquilado">Alquilado</option><option value="vendido">Vendido</option></select></label>
          </div>
          <label>Ubicacion<input value={form.locationText} onChange={(event) => setForm({ ...form, locationText: event.target.value })} required /></label>
          <div className={styles.twoCols}>
            <label>Latitud<input value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} required /></label>
            <label>Longitud<input value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} required /></label>
          </div>
          <div className={styles.threeCols}>
            <label>Dormitorios<input value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} /></label>
            <label>Banos<input value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} /></label>
            <label>m2<input value={form.areaM2} onChange={(event) => setForm({ ...form, areaM2: event.target.value })} /></label>
          </div>
          <div className={styles.operations}>
            <label><input type="checkbox" checked={form.operations.includes("alquiler")} onChange={() => toggleOperation("alquiler")} /> Alquiler</label>
            <label><input type="checkbox" checked={form.operations.includes("venta")} onChange={() => toggleOperation("venta")} /> Venta</label>
          </div>
          <div className={styles.twoCols}>
            <label>Precio<input value={form.priceAmount} onChange={(event) => setForm({ ...form, priceAmount: event.target.value })} /></label>
            <label>Moneda<select value={form.priceCurrency} onChange={(event) => setForm({ ...form, priceCurrency: event.target.value as PropertyCurrency })}><option value="UYU">Pesos uruguayos</option><option value="USD">Dolares</option></select></label>
          </div>
          <div className={styles.twoCols}>
            <label>Foto<input type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} /></label>
            <label>Video<input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)} /></label>
          </div>
          <button type="submit" disabled={busy}>{busy ? "Guardando..." : "Guardar publicacion"}</button>
        </form>

        <div className={styles.list}>
          {listings.map((listing) => (
            <article key={listing.id} className={styles.item}>
              <div>
                <strong>{listing.title}</strong>
                <p>{listing.asespro_properties?.location_text ?? "Sin ubicacion"} · {listing.status}</p>
              </div>
              <button type="button" onClick={() => editListing(listing)}>Editar</button>
            </article>
          ))}
          {listings.length === 0 ? <p className={styles.empty}>Todavia no hay publicaciones cargadas.</p> : null}
        </div>
      </section>
    </main>
  );
}
