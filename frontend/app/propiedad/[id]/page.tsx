import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Map } from "@/components/map";
import { getPublicPropertyById } from "@/lib/propertyRepository";
import { buildPropertyWhatsAppUrl, formatPrice } from "@/lib/properties";

import styles from "./PropertyDetailPage.module.css";

type PropertyDetailPageProps = {
  params: {
    id: string;
  };
};

const DEFAULT_WHATSAPP_PHONE = "59800000000";

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const property = await getPublicPropertyById(params.id);

  if (!property) {
    return {
      title: "Propiedad no encontrada",
      description: "La propiedad solicitada no esta disponible.",
    };
  }

  return {
    title: property.title,
    description: `${property.location}. ${property.description}`,
  };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps): Promise<JSX.Element> {
  const property = await getPublicPropertyById(params.id);

  if (!property) {
    notFound();
  }

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? DEFAULT_WHATSAPP_PHONE;
  const whatsappUrl = buildPropertyWhatsAppUrl(property, phone);
  const gallery = property.photoUrls.length > 0 ? property.photoUrls : [];
  const cover = gallery[0];
  const priceLabel = property.operation === "alquiler" ? "Precio de alquiler" : "Precio de venta";

  return (
    <main>
      <section className={styles.gallery}>
        <article className={styles.mainMedia}>
          <img src={cover} alt="" />
          <div className={styles.mainCaption}>
            <h1>{property.title}</h1>
            <p>{property.location}</p>
          </div>
        </article>

        <div className={styles.sideGrid}>
          <article className={styles.sideMedia}>
            <img src={gallery[0]} alt="" />
          </article>
          <article className={styles.sideMedia}>
            <img src={gallery[1]} alt="" />
          </article>
        </div>
      </section>

      <section className={styles.statsBar}>
        <article>
          <strong>{property.bedrooms ?? "N/D"}</strong>
          <span>Habitaciones</span>
        </article>
        <article>
          <strong>{property.bathrooms ?? "N/D"}</strong>
          <span>Banos</span>
        </article>
        <article>
          <strong>{property.areaM2 ? `${property.areaM2} m2` : "N/D"}</strong>
          <span>Superficie</span>
        </article>
      </section>

      <section className={styles.content}>
        <article className={styles.article}>
          <div className={styles.pillRow}>
            <span className={styles.pill}>{property.operation}</span>
            <span className={styles.pill}>{property.type}</span>
            <span className={styles.pill}>{property.status}</span>
          </div>

          <h2 className={styles.sectionTitle}>Vision de la propiedad</h2>
          <p>{property.description}</p>
          <p>
            Cada ambiente fue seleccionado para maximizar la entrada de luz natural y la integracion entre interior y
            exterior, respetando la identidad arquitectonica del proyecto.
          </p>

          <h2 className={styles.sectionTitle}>Amenidades exclusivas</h2>
          <div className={styles.amenities}>
            <span>Terraza privada</span>
            <span>Seguridad 24/7</span>
            <span>Piscina</span>
            <span>Gimnasio equipado</span>
          </div>

          <h2 className={styles.sectionTitle}>Ubicacion estrategica</h2>
          <p>{property.location}</p>

          {property.videoUrl ? (
            <>
              <h2 className={styles.sectionTitle}>Video de la propiedad</h2>
              <div className={styles.videoWrap}>
                <iframe
                  src={property.videoUrl}
                  title={`Video de ${property.title}`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </>
          ) : null}

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
              initialCenter={{ lat: property.lat, lng: property.lng }}
              initialZoom={14}
              minZoom={6}
              maxZoom={18}
              height={360}
            />
          </div>
        </article>

        <aside className={styles.aside}>
          <p className={styles.priceLabel}>{priceLabel}</p>
          <h3 className={styles.price}>{formatPrice(property.price)}</h3>
          <div className={styles.agent}>
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80" alt="" />
            <div>
              <strong>Adrian Castro</strong>
              <p>Curador de propiedades senior</p>
            </div>
          </div>

          <div className={styles.asideActions}>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.primaryAction}>
              Consulta por WhatsApp
            </a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.secondaryAction}>
              Agendar visita
            </a>
          </div>

          <p className={styles.refCode}>Referencia: {property.id.toUpperCase()}</p>
        </aside>
      </section>
    </main>
  );
}
