"use client";

import { useMemo, useState } from "react";
import { Map } from "@/components/map";
import { PropertyExplorer } from "@/features/property-explorer/PropertyExplorer";
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
  operationHint,
}: ListingWithViewToggleProps): JSX.Element {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

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
                className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
                onClick={() => setViewMode("grid")}
              >
                Cuadricula
              </button>
              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === "map" ? styles.viewBtnActive : ""}`}
                onClick={() => setViewMode("map")}
              >
                Mapa
              </button>
            </div>
          </div>
        </section>

        {viewMode === "map" ? (
          <PropertyExplorer
            properties={properties}
            title="Vista de mapa con filtros"
            hint={operationHint}
            showOperationFilter={false}
          />
        ) : (
          <>
            <section className={styles.grid}>
              {cards.map((property) => (
                <article className={styles.card} key={property.id}>
                  <a href={`/propiedad/${property.id}`} target="_blank" rel="noreferrer" className={styles.cardHitArea}>
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
                        <p className={styles.cardPrice}>{formatPrice(property.price)}</p>
                      </div>
                      <p className={styles.cardLocation}>{property.location}</p>
                      <p className={styles.cardMeta}>
                        <span><i className={`${styles.metaIcon} ${styles.metaBed}`} />{property.bedrooms ?? "--"} dorm</span>
                        <span><i className={`${styles.metaIcon} ${styles.metaBath}`} />{property.bathrooms ?? "--"} banos</span>
                        <span><i className={`${styles.metaIcon} ${styles.metaArea}`} />{property.areaM2 ? `${property.areaM2} m2` : "N/D"}</span>
                        <span><i className={`${styles.metaIcon} ${styles.metaStatus}`} />{property.status}</span>
                      </p>
                    </div>
                  </a>
                </article>
              ))}
            </section>

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
        )}
      </div>
    </main>
  );
}


