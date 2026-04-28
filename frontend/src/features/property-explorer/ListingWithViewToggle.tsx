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

  const cards = useMemo(() => {
    if (properties.length === 0) {
      return [];
    }

    return Array.from({ length: 6 }, (_, index) => properties[index % properties.length]);
  }, [properties]);

  return (
    <main>
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
            {cards.map((property, index) => (
              <article className={styles.card} key={`${property.id}-${index}`}>
                <a href={`/propiedad/${property.id}`} target="_blank" rel="noreferrer" className={styles.cardHitArea}>
                  <div className={styles.cardMedia}>
                    <div className={styles.mediaSlider} aria-hidden="true">
                      {(property.photoUrls.length > 0 ? property.photoUrls : [getPropertyCoverImage(property.id)]).slice(0, 3).map((photo, photoIndex) => (
                        <img key={`${property.id}-photo-${photoIndex}`} src={photo} alt="" className={styles.slideImage} />
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
                      <span><i className={styles.metaDot} />{property.bedrooms ?? "--"} dorm</span>
                      <span><i className={styles.metaDot} />{property.bathrooms ?? "--"} banos</span>
                      <span><i className={styles.metaDot} />{property.areaM2 ? `${property.areaM2} m2` : "N/D"}</span>
                      <span><i className={styles.metaDot} />{property.status}</span>
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
              <button type="button" className={styles.cardLink} onClick={() => setViewMode("map")}>
                Activar vista de mapa
              </button>
            </div>
            <div className={styles.mapFrame}>
              <Map properties={properties} initialCenter={{ lat: -32.822, lng: -56.528 }} initialZoom={13} minZoom={13} maxZoom={18} height={420} />
              <a href="/mapa" className={styles.mapLockLayer}>
                Click para activar mapa interactivo
              </a>
            </div>
          </section>
        </>
      )}
    </main>
  );
}


