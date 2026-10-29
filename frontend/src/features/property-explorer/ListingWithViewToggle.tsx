"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Map } from "@/components/map";
import { PropertyFacts } from "@/components/properties/PropertyFacts";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { propertyDescription } from "@/lib/propertyPresentation";
import { formatPrice, type PropertyListing } from "@/lib/properties";

import styles from "../../../app/ListingPage.module.css";

type ListingWithViewToggleProps = {
  operation: "alquiler" | "venta";
  title: string;
  description: string;
  properties: PropertyListing[];
  mapTitle: string;
  mapDescription: string;
  operationHint: string;
};

export function ListingWithViewToggle({
  operation,
  title,
  description,
  properties,
  mapTitle,
  mapDescription,
}: ListingWithViewToggleProps): JSX.Element {
  const cards = useMemo(() => properties.filter((property) => property.status === "activo"), [properties]);

  const getDisplayPhotos = (property: PropertyListing): string[] => {
    const validPhotos = property.photoUrls.filter((photo) => typeof photo === "string" && photo.trim().length > 0);
    if (validPhotos.length > 0) {
      return validPhotos.slice(0, 3);
    }
    return [getPropertyCoverImage(property.id)];
  };

  return (
    <main>
      <div className="page-shell">
        <section className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.description}>{description}</p>
            </div>
          </div>
          <div className={styles.catalogToolbar}>
            <nav className={styles.viewSwitch} aria-label="Operación de las propiedades">
              <Link href="/alquiler" className={`${styles.viewBtn} ${operation === "alquiler" ? styles.viewBtnActive : ""}`} aria-current={operation === "alquiler" ? "page" : undefined}>Alquiler</Link>
              <Link href="/venta" className={`${styles.viewBtn} ${operation === "venta" ? styles.viewBtnActive : ""}`} aria-current={operation === "venta" ? "page" : undefined}>Venta</Link>
            </nav>
            <div className={styles.viewSwitch}>
              <button
                type="button"
                className={`${styles.viewBtn} ${styles.viewBtnActive}`}
              >
                Cuadrícula
              </button>
              <Link href="/mapa" className={styles.viewBtn}>
                Mapa
              </Link>
            </div>
          </div>
        </section>

        <>
            <section className={styles.grid}>
              {cards.length === 0 && <p>No hay propiedades publicadas por el momento. Contactanos para consultar disponibilidad.</p>}
              {cards.map((property) => (
                <article className={styles.card} key={property.id}>
                  <div className={styles.cardHitArea}>
                    <div className={styles.cardMedia}>
                      <Link href={`/propiedad/${property.id}`} aria-label={`Ver ${property.title}`} className={styles.mediaSlider}><img src={getDisplayPhotos(property)[0]} alt="" className={`${styles.slideImage} ${styles.slideImageStatic}`} loading="lazy" style={{objectPosition:`${property.media?.[0]?.focalX??50}% ${property.media?.[0]?.focalY??50}%`}} /></Link>
                      {property.videoUrl&&<Link href={`/propiedad/${property.id}#video`} className={styles.videoBadge}>▷ Ver video</Link>}
                      <div className={styles.badgeRow}>
                        <span className={styles.badge}>{property.operation}</span>
                        <span className={styles.badge}>{property.type}</span>
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.titleRow}>
                        <h2 className={styles.cardTitle}><Link href={`/propiedad/${property.id}`}>{property.title}</Link></h2>
                        {!property.hidePrice && <p className={styles.cardPrice}>{formatPrice(property.price, property.priceCurrency)}</p>}
                      </div>
                      <p className={styles.cardLocation}>{property.location}</p>
                      <PropertyFacts property={property} />
                      <p className={styles.cardSummary}>{property.publicSummary||propertyDescription(property)}</p>
                      <div className={styles.cardBottom}><span>Consultá condiciones</span><Link href={`/propiedad/${property.id}`}>Ver propiedad →</Link></div>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {cards.length === 0 ? (
              <section className={styles.emptyState}>
                <h2>No hay publicaciones activas en este momento</h2>
                <p>Podés cambiar de operación o consultarnos por WhatsApp para conocer las próximas opciones.</p>
                <Link href="/contacto" className={styles.emptyAction}>
                  Consultar disponibilidad
                </Link>
              </section>
            ) : null}

            <section className={styles.mapSection}>
              <div className={styles.mapHead}>
                <div>
                  <h2>{mapTitle}</h2>
                  <p>{mapDescription}</p>
                </div>
              </div>
              <div className={styles.mapFrame}>
                <Map properties={properties} initialCenter={{ lat: -32.822, lng: -56.528 }} initialZoom={13} minZoom={13} maxZoom={18} height={315} />
                <a href="/mapa" className={styles.mapLockLayer} aria-label="Abrir mapa completo">
                  Click para activar mapa interactivo
                </a>
              </div>
            </section>
        </>
      </div>
    </main>
  );
}


