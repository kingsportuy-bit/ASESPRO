"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Map } from "@/components/map";
import { PropertyFacts } from "@/components/properties/PropertyFacts";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { formatPrice, type PropertyListing } from "@/lib/properties";

import styles from "../../../app/ListingPage.module.css";

type ListingWithViewToggleProps = {
  title: string;
  description: string;
  properties: PropertyListing[];
  mapTitle: string;
  mapDescription: string;
  operationHint: string;
};

export function ListingWithViewToggle({
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
            <div className={styles.viewSwitch}>
              <button
                type="button"
                className={`${styles.viewBtn} ${styles.viewBtnActive}`}
              >
                Cuadricula
              </button>
              <Link href="/mapa" className={styles.viewBtn}>
                Mapa
              </Link>
            </div>
          </div>
        </section>

        <>
            <section className={styles.grid}>
              {cards.map((property) => (
                <article className={styles.card} key={property.id}>
                  <Link href={`/propiedad/${property.id}`} className={styles.cardHitArea}>
                    <div className={styles.cardMedia}>
                      <div className={styles.mediaSlider} aria-hidden="true">
                        {getDisplayPhotos(property).map((photo, photoIndex, photoList) => (
                          <img
                            key={`${property.id}-photo-${photoIndex}`}
                            src={photo}
                            alt=""
                            className={`${styles.slideImage} ${
                              photoIndex === 0
                                ? styles.slideImageStatic
                                : photoList.length > 1
                                  ? styles.slideImageAnimated
                                  : styles.slideImageStatic
                            }`}
                            onError={(event) => {
                              const fallback = getPropertyCoverImage(property.id);
                              if (event.currentTarget.src !== fallback) {
                                event.currentTarget.src = fallback;
                              }
                            }}
                            loading="lazy"
                          />
                        ))}
                      </div>
                      <div className={styles.badgeRow}>
                        <span className={styles.badge}>{property.operation}</span>
                        <span className={styles.badge}>{property.type}</span>
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.titleRow}>
                        <h2 className={styles.cardTitle}>{property.title}</h2>
                        <p className={styles.cardPrice}>{formatPrice(property.price, property.priceCurrency)}</p>
                      </div>
                      <p className={styles.cardLocation}>{property.location}</p>
                      <PropertyFacts property={property} />
                    </div>
                  </Link>
                </article>
              ))}
            </section>

            {cards.length === 0 ? (
              <section className={styles.emptyState}>
                <h2>No hay publicaciones activas en este momento</h2>
                <p>El equipo puede cargar nuevas propiedades desde el panel. Mientras tanto, la consulta por WhatsApp sigue disponible.</p>
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


