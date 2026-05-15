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
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M15 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8v5h-8v-5h-2v22h34v8h-5v3a13 13 0 0 1-13 13H25a13 13 0 0 1-13-13v-3H7v-8h8V12Zm6 30v3a5 5 0 0 0 5 5h12a5 5 0 0 0 5-5v-3H21Z" /></svg>;
  }
  if (type === "area") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 12h40v40H12V12Zm8 8v24h24V20H20Zm14-14h18v18h-7v-6H34V6ZM6 34h12v7h-5v11H6V34Z" /></svg>;
  }
  if (type === "bedrooms") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 24h18a7 7 0 0 1 7 7v3h15a8 8 0 0 1 8 8v13h-9v-6H16v6H7V16h9v18h13v-3a2 2 0 0 0-2-2H9v-5Z" /></svg>;
  }
  if (type === "casa") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 31 32 8l26 23-5 7-4-4v23H36V42h-8v15H15V34l-4 4-5-7Z" /></svg>;
  }
  if (type === "apartamento") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 6h36a5 5 0 0 1 5 5v42h5v6H4v-6h5V11a5 5 0 0 1 5-5Zm10 10v8h7v-8h-7Zm16 0v8h7v-8h-7ZM24 32v8h7v-8h-7Zm16 0v8h7v-8h-7ZM28 53h8V43h-8v10Z" /></svg>;
  }
  if (type === "garage") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M11 34h4l6-13h22l6 13h4a5 5 0 0 1 5 5v12h-8v6h-8v-6H22v6h-8v-6H6V39a5 5 0 0 1 5-5Zm13-5-2 5h20l-2-5H24Z" /></svg>;
  }
  if (type === "patio") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M28 52V37C17 36 10 30 10 21a12 12 0 0 1 22-7 11 11 0 0 1 20 7c0 9-7 15-18 16v15h18v6H12v-6h16Z" /></svg>;
  }
  if (type === "laundry") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 6h30a5 5 0 0 1 5 5v42a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5V11a5 5 0 0 1 5-5Zm4 8v8h22v-8H21Zm11 15a12 12 0 1 0 0 24 12 12 0 0 0 0-24Z" /></svg>;
  }
  if (type === "living") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 25h30a8 8 0 0 1 8 8v15h-5v8h-8v-8H22v8h-8v-8H9V33a8 8 0 0 1 8-8Zm2-9h26a7 7 0 0 1 7 7v4a12 12 0 0 0-5-1H17a12 12 0 0 0-5 1v-4a7 7 0 0 1 7-7Z" /></svg>;
  }
  if (type === "dining") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 31h28a5 5 0 0 1 5 5v6H13v-6a5 5 0 0 1 5-5Zm11 11h6v16h-6V42Zm-18 3h7l-4 13H8l3-13Zm35 0h7l3 13h-6l-4-13ZM22 17a7 7 0 0 1 7 7v4H15v-4a7 7 0 0 1 7-7Zm20 0a7 7 0 0 1 7 7v4H35v-4a7 7 0 0 1 7-7Z" /></svg>;
  }
  if (type === "kitchen") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 6h36a4 4 0 0 1 4 4v44a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Zm5 9v11h26V15H19Zm0 20v14h26V35H19Z" /></svg>;
  }
  if (type === "balcony") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 8h30v28h7v8h-5v14h-7V44h-7v14h-6V44h-7v14h-7V44h-5v-8h7V8Zm8 8v20h14V16H25Z" /></svg>;
  }
  if (type === "security") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5c8 6 16 8 24 8v15c0 15-9 26-24 31C17 54 8 43 8 28V13c8 0 16-2 24-8Zm-9 28h18v-7a9 9 0 0 0-18 0v7Zm5 0h8v13h-8V33Z" /></svg>;
  }
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M19 14a4 4 0 0 1 8 0v23h10V14a4 4 0 0 1 8 0v23h7v7H12v-7h7V14Zm-4 38c4 3 8 3 12 0s8-3 12 0 8 3 12 0v6c-4 3-8 3-12 0s-8-3-12 0-8 3-12 0v-6Z" /></svg>;
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
          media={property.media}
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


