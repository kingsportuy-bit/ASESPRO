import { useEffect, useRef, useState, type RefObject } from "react";
import type { Map as LeafletMap } from "leaflet";

import type { LatLng, MapBounds } from "../types";

type UseLeafletMapParams = {
  containerRef: RefObject<HTMLDivElement | null>;
  tileUrl: string;
  tileAttribution: string;
  initialCenter: LatLng;
  initialZoom: number;
  minZoom?: number;
  maxZoom?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
};

function getBoundsPayload(map: LeafletMap): MapBounds {
  const bounds = map.getBounds();

  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
}

export function useLeafletMap({
  containerRef,
  tileUrl,
  tileAttribution,
  initialCenter,
  initialZoom,
  minZoom,
  maxZoom,
  onBoundsChange,
}: UseLeafletMapParams): LeafletMap | null {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    let cancelled = false;
    let localMap: LeafletMap | null = null;
    let emitBounds: (() => void) | null = null;

    const setupMap = async () => {
      const L = await import("leaflet");

      if (cancelled || !containerRef.current) {
        return;
      }

      localMap = L.map(containerRef.current, {
        zoomControl: false,
        minZoom,
        maxZoom,
      }).setView([initialCenter.lat, initialCenter.lng], initialZoom);

      L.tileLayer(tileUrl, {
        attribution: tileAttribution,
        maxZoom: maxZoom ?? 19,
        minZoom: minZoom ?? 0,
      }).addTo(localMap);

      L.control
        .zoom({
          position: "topright",
        })
        .addTo(localMap);

      emitBounds = () => {
        if (localMap) {
          onBoundsChangeRef.current?.(getBoundsPayload(localMap));
        }
      };

      localMap.whenReady(() => {
        localMap?.invalidateSize();
        emitBounds?.();
      });

      localMap.on("moveend", emitBounds);
      setMap(localMap);
    };

    void setupMap();

    return () => {
      cancelled = true;
      if (localMap && emitBounds) {
        localMap.off("moveend", emitBounds);
      }
      localMap?.remove();
      setMap(null);
    };
  }, [containerRef, tileUrl, tileAttribution, minZoom, maxZoom, initialCenter.lat, initialCenter.lng, initialZoom]);

  return map;
}

