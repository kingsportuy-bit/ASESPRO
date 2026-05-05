import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { formatPrice as formatPropertyPrice } from "@/lib/properties";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";

import styles from "./PropertyMarker.module.css";
import type { Property } from "./types";

type PropertyMarkerProps = {
  property: Property;
  highlighted?: boolean;
};

function formatPrice(price?: number, currency?: string): string {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return "Ver";
  }

  return formatPropertyPrice(price, currency ?? "USD");
}

export function PropertyMarker({ property, highlighted = false }: PropertyMarkerProps): React.JSX.Element {
  return (
    <div className={`${styles.marker} ${highlighted ? styles.markerHighlighted : ""}`} aria-label={`Propiedad ${property.id}`}>
      <span className={styles.badge}>{formatPrice(property.price, property.priceCurrency)}</span>
      <span className={styles.pointer} />
    </div>
  );
}

export function renderPropertyMarkerHtml(property: Property, highlighted = false): string {
  return renderToStaticMarkup(<PropertyMarker property={property} highlighted={highlighted} />);
}

function getPreviewImages(property: Property): string[] {
  const photos = property.photoUrls?.filter((photo) => photo.trim().length > 0).slice(0, 6) ?? [];
  return photos.length > 0 ? photos : [getPropertyCoverImage(property.id)];
}

function formatMeta(property: Property): string {
  const items = [
    property.bathrooms ? `${property.bathrooms} baño${property.bathrooms === 1 ? "" : "s"}` : null,
    property.bedrooms ? `${property.bedrooms} dorm.` : null,
    property.areaM2 ? `${property.areaM2} m2` : null,
  ].filter(Boolean);

  return items.length > 0 ? items.join(" | ") : "Ver detalles de la propiedad";
}

export function PropertyPreviewCard({ property }: { property: Property }): React.JSX.Element {
  const title = property.title ?? "Propiedad ASESPRO";
  const location = property.location ?? "";
  const images = getPreviewImages(property);

  return (
    <div
      className={styles.previewCard}
      data-property-preview-card="true"
      data-property-url={`/propiedad/${property.id}`}
      aria-label={`Abrir ${title} en una pestaña nueva`}
    >
      <div className={styles.previewGallery} aria-label="Fotos de la propiedad" data-preview-gallery="true" data-active-index="0">
        {images.map((photo, index) => (
          <img
            key={`${photo}-${index}`}
            src={photo}
            alt=""
            className={`${styles.previewImage} ${index === 0 ? styles.previewImageActive : ""}`}
            data-preview-image="true"
          />
        ))}
        {images.length > 1 ? (
          <div className={styles.previewControls} aria-hidden="false">
            <button type="button" className={styles.previewControl} data-preview-direction="prev" aria-label="Foto anterior">
              {"<"}
            </button>
            <button type="button" className={styles.previewControl} data-preview-direction="next" aria-label="Foto siguiente">
              {">"}
            </button>
          </div>
        ) : null}
      </div>
      <div className={styles.previewBody}>
        <p className={styles.previewTitle}>{title}</p>
        {location ? <p className={styles.previewLocation}>{location}</p> : null}
        <strong className={styles.previewPrice}>{formatPrice(property.price, property.priceCurrency)}</strong>
        <p className={styles.previewMeta}>{formatMeta(property)}</p>
      </div>
    </div>
  );
}

export function renderPropertyPreviewHtml(property: Property): string {
  return renderToStaticMarkup(<PropertyPreviewCard property={property} />);
}
