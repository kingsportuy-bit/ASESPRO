import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Map } from "@/components/map";
import { getPublicPropertyById } from "@/lib/propertyRepository";
import { buildPropertyWhatsAppUrl, formatOperationLabel, formatPrice, propertyMatchesOperation, type PropertyAmenityKey } from "@/lib/properties";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { PropertyMediaGallery } from "./PropertyMediaGallery";

import styles from "./PropertyDetailPage.module.css";

type PropertyDetailPageProps = {
  params: {
    id: string;
  };
};

const DEFAULT_WHATSAPP_PHONE = "59898382388";

type AmenityItem = {
  key: PropertyAmenityKey | "bathrooms" | "area" | "bedrooms" | "casa" | "apartamento";
  label: string;
  value?: string;
};

const AMENITY_LABELS: Array<{ key: PropertyAmenityKey; label: string }> = [
  { key: "garage", label: "Garaje" },
  { key: "patio", label: "Patio / jardín" },
  { key: "laundry", label: "Lavadero" },
  { key: "living", label: "Living / estar" },
  { key: "dining", label: "Comedor" },
  { key: "kitchen", label: "Cocina" },
  { key: "balcony", label: "Balcón" },
  { key: "security", label: "Seguridad" },
  { key: "pool", label: "Pileta" },
];

function AmenityIcon({ type }: { type: AmenityItem["key"] }): JSX.Element {
  if (type === "bathrooms") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 8a7 7 0 0 1 14 0v5h5v7H24V8a2 2 0 0 0-4 0v25h37v7h-4v4a14 14 0 0 1-11 14l1 4H21l1-4A14 14 0 0 1 11 44v-4H7v-7h10V8Zm3 32v4a7 7 0 0 0 7 7h10a7 7 0 0 0 7-7v-4H20Zm20-27h10v7H40v-7Z" /></svg>;
  }
  if (type === "area") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M11 10h8v6h-3v32h3v6h-8v-8H5v-8h6V26H5v-8h6v-8Zm15 8h28v28H26V18Zm5 22h18V24H31v16Zm2-30h16V5l10 8-10 8v-5H33v5l-10-8 10-8v5Z" /></svg>;
  }
  if (type === "bedrooms") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 18a6 6 0 0 1 6-6h6a9 9 0 0 1 9 9v7h2v-7a9 9 0 0 1 9-9h6a6 6 0 0 1 6 6v12a9 9 0 0 1 6 9v15h-8v-6H12v6H4V39a9 9 0 0 1 6-9V18Zm8 10h9v-7a5 5 0 0 0-5-5h-4v12Zm20 0h10V16h-6a5 5 0 0 0-5 5v7h1ZM12 38v4h40v-4a3 3 0 0 0-3-3H15a3 3 0 0 0-3 3Z" /></svg>;
  }
  if (type === "casa") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 31 32 7l26 24-5 6-4-4v24H37V40H27v17H15V33l-4 4-5-6Zm41-18h8v13l-8-7v-6Z" /></svg>;
  }
  if (type === "apartamento") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M13 6h38a5 5 0 0 1 5 5v42h4v6H4v-6h4V11a5 5 0 0 1 5-5Zm8 8v8h8v-8h-8Zm14 0v8h8v-8h-8ZM21 29v8h8v-8h-8Zm14 0v8h8v-8h-8ZM27 53h10V42H27v11Z" /></svg>;
  }
  if (type === "garage") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 36h4l6-15a8 8 0 0 1 7-5h12a8 8 0 0 1 7 5l6 15h4a4 4 0 0 1 4 4v5h-5v10h-9V45H19v10h-9V45H5v-5a4 4 0 0 1 4-4Zm13-2h20l-4-10H26l-4 10Zm-5 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm30 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" /></svg>;
  }
  if (type === "patio") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M29 52V36c-11-1-19-8-19-17A13 13 0 0 1 34 12a11 11 0 0 1 19 8c0 9-7 15-17 16v16h16v6H12v-6h17Z" /></svg>;
  }
  if (type === "laundry") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 6h30a5 5 0 0 1 5 5v42a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5V11a5 5 0 0 1 5-5Zm3 8v7h24v-7H20Zm12 13a13 13 0 1 0 0 26 13 13 0 0 0 0-26Zm-6 13c5 4 10 4 16 0a9 9 0 0 1-16 0Zm16-23a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /></svg>;
  }
  if (type === "living") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 24h30a8 8 0 0 1 8 8v16h-5v8h-8v-8H22v8h-8v-8H9V32a8 8 0 0 1 8-8Zm1-8h28a7 7 0 0 1 7 7v5a12 12 0 0 0-6-2H17c-2 0-4 1-6 2v-5a7 7 0 0 1 7-7Z" /></svg>;
  }
  if (type === "dining") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 30h24a5 5 0 0 1 5 5v5H15v-5a5 5 0 0 1 5-5Zm9 10h6v16h-6V40Zm-18 1h6l-3 17H8l3-17Zm36 0h6l3 17h-6l-3-17ZM14 19a7 7 0 1 1 14 0v5H14v-5Zm22 0a7 7 0 1 1 14 0v5H36v-5Z" /></svg>;
  }
  if (type === "kitchen") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 6h36a4 4 0 0 1 4 4v44a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Zm4 8v10h28V14H18Zm0 18v18h28V32H18Zm4-15h7v4h-7v-4Zm15 0a3 3 0 1 0 0 .1V17Zm9 0a3 3 0 1 0 0 .1V17Z" /></svg>;
  }
  if (type === "balcony") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 8h32v28h6v8h-5v14h-6V44h-8v14h-6V44h-8v14h-6V44h-5v-8h6V8Zm7 7v21h18V15H23Zm6 4h6v17h-6V19Z" /></svg>;
  }
  if (type === "security") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5c8 6 16 8 24 8v15c0 15-9 26-24 31C17 54 8 43 8 28V13c8 0 16-2 24-8Zm-9 27h18v-7a9 9 0 0 0-18 0v7Zm5 0v-7a4 4 0 0 1 8 0v7h-8Zm4 8a4 4 0 0 0-2 7v5h4v-5a4 4 0 0 0-2-7Z" /></svg>;
  }
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M19 13a4 4 0 0 1 8 0v24h10V13a4 4 0 0 1 8 0v24h7v6H12v-6h7V13Zm-4 40c4 3 8 3 12 0s8-3 12 0 8 3 12 0v6c-4 3-8 3-12 0s-8-3-12 0-8 3-12 0v-6Zm0-10c4 3 8 3 12 0s8-3 12 0 8 3 12 0v6c-4 3-8 3-12 0s-8-3-12 0-8 3-12 0v-6Z" /></svg>;
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const property = await getPublicPropertyById(params.id);

  if (!property) {
    return {
      title: "Propiedad no encontrada",
      description: "La propiedad solicitada no esta disponible en ASESPRO.",
    };
  }

  return {
    title: property.title,
    description: `${property.location}. Revisa datos, fotos, precio y consulta disponibilidad con ASESPRO. ${property.description}`,
  };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps): Promise<JSX.Element> {
  const property = await getPublicPropertyById(params.id);

  if (!property) {
    notFound();
  }

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? DEFAULT_WHATSAPP_PHONE;
  const whatsappUrl = buildPropertyWhatsAppUrl(property, phone);
  const fallbackImage = getPropertyCoverImage(property.id);
  const gallery = property.photoUrls.filter((photo) => typeof photo === "string" && photo.trim().length > 0);
  const galleryWithFallback = gallery.length > 0 ? gallery : [fallbackImage];
  const videoUrl = property.videoUrl;
  const priceLabel = propertyMatchesOperation(property, "alquiler") ? "Precio de alquiler" : "Precio de venta";
  const amenityItems: AmenityItem[] = [
    ...(property.bathrooms ? [{ key: "bathrooms" as const, label: "Baños", value: String(property.bathrooms) }] : []),
    ...(property.areaM2 ? [{ key: "area" as const, label: "Metros cuadrados", value: `${property.areaM2} m2` }] : []),
    ...(property.bedrooms ? [{ key: "bedrooms" as const, label: "Habitaciones", value: String(property.bedrooms) }] : []),
    ...(property.type === "casa" ? [{ key: "casa" as const, label: "Casa" }] : []),
    ...(property.type === "apartamento" ? [{ key: "apartamento" as const, label: "Apartamento" }] : []),
    ...AMENITY_LABELS.filter((item) => property.amenities?.[item.key]).map((item) => ({ key: item.key, label: item.label })),
  ];

  return (
    <main>
      <div className="page-shell">
        <PropertyMediaGallery
          title={property.title}
          location={property.location}
          photos={galleryWithFallback}
          videoUrl={videoUrl}
          fallbackImage={fallbackImage}
        />

        <section className={styles.content}>
          <article className={styles.article}>
            <div className={styles.pillRow}>
              <span className={styles.pill}>{formatOperationLabel(property)}</span>
              <span className={styles.pill}>{property.type}</span>
            </div>

          <h2 className={styles.sectionTitle}>Descripción de la propiedad</h2>
          <p className={styles.commercialDescription}>{property.description}</p>
          <p>
            Revisa los datos principales de la propiedad y contactanos para confirmar disponibilidad, coordinar una
            visita o pedir más información.
          </p>

          <h2 className={styles.sectionTitle}>Características</h2>
          <div className={styles.amenities}>
            {amenityItems.map((item) => (
              <article key={`${item.key}-${item.label}`}>
                <AmenityIcon type={item.key} />
                <strong>{item.value ?? item.label}</strong>
                {item.value ? <span>{item.label}</span> : null}
              </article>
            ))}
          </div>

          <h2 className={styles.sectionTitle}>Ubicación</h2>
          <p>{property.location}</p>

          <div className={styles.mapWrap} role="region" aria-label="Ubicación de la propiedad en el mapa">
            <Map
              properties={[
                {
                  id: property.id,
                  lat: property.lat,
                  lng: property.lng,
                  price: property.price,
                },
              ]}
              highlightedPropertyId={property.id}
              initialCenter={{ lat: property.lat, lng: property.lng }}
              initialZoom={14}
              minZoom={13}
              maxZoom={18}
              height={360}
            />
            <a href={`/mapa?highlight=${property.id}`} className={styles.mapLockLayer}>
              Click para abrir vista mapa
            </a>
            <a href={`/mapa?highlight=${property.id}`} className={styles.mapFullButton}>
              Ver mapa completo
            </a>
          </div>
          </article>

          <aside className={styles.aside}>
            <p className={styles.priceLabel}>{priceLabel}</p>
            <h3 className={styles.price}>{formatPrice(property.price, property.priceCurrency)}</h3>
            <div className={styles.agent}>
              <span className={styles.agentAvatar} aria-hidden="true" />
              <div>
                <strong>Josema Fernandez</strong>
                <p>Agente inmobiliario</p>
              </div>
            </div>

            <div className={styles.asideActions}>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.primaryAction}>
                Consultar por esta propiedad
              </a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.secondaryAction}>
                Agendar visita
              </a>
            </div>

            <p className={styles.refCode}>Referencia: {property.id.toUpperCase()}</p>
          </aside>
        </section>
      </div>
    </main>
  );
}


