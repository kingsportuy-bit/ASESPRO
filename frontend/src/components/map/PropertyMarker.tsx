import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import styles from "./PropertyMarker.module.css";
import type { Property } from "./types";

type PropertyMarkerProps = {
  property: Property;
  highlighted?: boolean;
};

function formatPrice(price?: number): string {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return "Ver";
  }

  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function PropertyMarker({ property, highlighted = false }: PropertyMarkerProps): React.JSX.Element {
  return (
    <div className={`${styles.marker} ${highlighted ? styles.markerHighlighted : ""}`} aria-label={`Propiedad ${property.id}`}>
      <span className={styles.badge}>{formatPrice(property.price)}</span>
      <span className={styles.pointer} />
    </div>
  );
}

export function renderPropertyMarkerHtml(property: Property, highlighted = false): string {
  return renderToStaticMarkup(<PropertyMarker property={property} highlighted={highlighted} />);
}
