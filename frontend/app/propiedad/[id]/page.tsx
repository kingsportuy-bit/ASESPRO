import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Map } from "@/components/map";
import { getPublicPropertyById } from "@/lib/propertyRepository";
import { buildPropertyWhatsAppUrl, formatOperationLabel, formatPrice, propertyMatchesOperation } from "@/lib/properties";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { PropertyMediaGallery } from "./PropertyMediaGallery";

import styles from "./PropertyDetailPage.module.css";

type PropertyDetailPageProps = {
  params: {
    id: string;
  };
};

const DEFAULT_WHATSAPP_PHONE = "59898382388";

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
  const priceLabel = propertyMatchesOperation(property, "alquiler") ? "Precio de alquiler" : "Precio de venta";

  return (
    <main>
      <div className="page-shell">
        <PropertyMediaGallery
          title={property.title}
          location={property.location}
          photos={galleryWithFallback}
          videoUrl={property.videoUrl}
          fallbackImage={fallbackImage}
        />

        <section className={styles.statsBar}>
          <article>
            <strong><i className={styles.statIcon} /> {property.bedrooms ?? "N/D"}</strong>
            <span>Dormitorios</span>
          </article>
          <article>
            <strong><i className={styles.statIcon} /> {property.bathrooms ?? "N/D"}</strong>
            <span>Banos</span>
          </article>
          <article>
            <strong><i className={styles.statIcon} /> {property.areaM2 ? `${property.areaM2} m2` : "N/D"}</strong>
            <span>Superficie</span>
          </article>
          <article>
            <strong><i className={styles.statIcon} /> {property.status}</strong>
            <span>Estado</span>
          </article>
        </section>

        <section className={styles.content}>
          <article className={styles.article}>
            <div className={styles.pillRow}>
              <span className={styles.pill}>{formatOperationLabel(property)}</span>
              <span className={styles.pill}>{property.type}</span>
              <span className={styles.pill}>{property.status}</span>
            </div>

          <h2 className={styles.sectionTitle}>Descripcion de la propiedad</h2>
          <p className={styles.commercialDescription}>{property.description}</p>
          <p>
            Revisa los datos principales de la propiedad y contactanos para confirmar disponibilidad, coordinar una
            visita o pedir mas informacion.
          </p>

          <h2 className={styles.sectionTitle}>Caracteristicas</h2>
          <div className={styles.amenities}>
            <span>{property.type}</span>
            <span>{formatOperationLabel(property)}</span>
            <span>{property.bedrooms ? `${property.bedrooms} dormitorios` : "Dormitorios a consultar"}</span>
            <span>{property.areaM2 ? `${property.areaM2} m2` : "Superficie a consultar"}</span>
          </div>

          <h2 className={styles.sectionTitle}>Ubicacion</h2>
          <p>{property.location}</p>

          <div className={styles.mapWrap} role="region" aria-label="Ubicacion de la propiedad en el mapa">
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
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80" alt="" />
              <div>
                <strong>Adrian Castro</strong>
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


