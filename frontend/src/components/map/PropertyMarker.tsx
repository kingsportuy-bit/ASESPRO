import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import styles from "./PropertyMarker.module.css";
import type { Property } from "./types";

type PropertyMarkerProps = {
  property: Property;
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

export function PropertyMarker({ property }: PropertyMarkerProps): React.JSX.Element {
  return (
    <div className={styles.marker} aria-label={`Propiedad ${property.id}`}>
      <span className={styles.badge}>{formatPrice(property.price)}</span>
      <span className={styles.pointer} />
    </div>
  );
}

export function renderPropertyMarkerHtml(property: Property): string {
  return renderToStaticMarkup(<PropertyMarker property={property} />);
}
