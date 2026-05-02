import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { formatPrice as formatPropertyPrice } from "@/lib/properties";

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
