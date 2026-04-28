"use client";

import React, { useMemo, useRef } from "react";

import { useLeafletMap } from "./hooks/useLeafletMap";
import { usePropertyMarkers } from "./hooks/usePropertyMarkers";
import styles from "./Map.module.css";
import type { LatLng, MapProps } from "./types";

const DEFAULT_CENTER: LatLng = {
  lat: -32.822,
  lng: -56.528,
};

const DEFAULT_ZOOM = 13;
const DEFAULT_MIN_ZOOM = 13;
const DEFAULT_MAX_ZOOM = 18;
const DEFAULT_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function Map({
  properties,
  highlightedPropertyId,
  onBoundsChange,
  onMarkerClick,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  tileUrl = DEFAULT_TILE_URL,
  tileAttribution = DEFAULT_TILE_ATTRIBUTION,
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
  className,
  height = 520,
}: MapProps): React.JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const inlineHeightStyle = useMemo<React.CSSProperties>(() => {
    if (typeof height === "number") {
      return { height: `${height}px` };
    }

    return { height };
  }, [height]);

  const map = useLeafletMap({
    containerRef: mapContainerRef,
    tileUrl,
    tileAttribution,
    initialCenter,
    initialZoom,
    minZoom,
    maxZoom,
    onBoundsChange,
  });

  usePropertyMarkers({
    map,
    properties,
    highlightedPropertyId,
    onMarkerClick,
  });

  return (
    <div className={`${styles.wrapper} ${className ?? ""}`} style={inlineHeightStyle}>
      <div ref={mapContainerRef} className={styles.canvas} />
    </div>
  );
}


