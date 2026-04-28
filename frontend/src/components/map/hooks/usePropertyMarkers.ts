import { useEffect, useRef } from "react";
import type { DivIcon, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

import { renderPropertyMarkerHtml } from "../PropertyMarker";
import type { Property } from "../types";

type UsePropertyMarkersParams = {
  map: LeafletMap | null;
  properties: Property[];
  highlightedPropertyId?: string;
  onMarkerClick?: (property: Property) => void;
};

type MarkerEntry = {
  marker: LeafletMarker;
  clickHandler: () => void;
};

const DEFAULT_ICON_SIZE: [number, number] = [68, 38];
const DEFAULT_ICON_ANCHOR: [number, number] = [34, 38];

function createPropertyIcon(leaflet: typeof import("leaflet"), property: Property, highlighted = false): DivIcon {
  return leaflet.divIcon({
    html: renderPropertyMarkerHtml(property, highlighted),
    className: "asespro-marker-host",
    iconSize: DEFAULT_ICON_SIZE,
    iconAnchor: DEFAULT_ICON_ANCHOR,
  });
}

/**
 * Syncs markers with incoming property data.
 *
 * TODO(clustering): For larger datasets, replace marker-by-marker rendering
 * with a clustered strategy while keeping this same hook contract.
 */
export function usePropertyMarkers({
  map,
  properties,
  highlightedPropertyId,
  onMarkerClick,
}: UsePropertyMarkersParams): void {
  const markerRegistryRef = useRef<Map<string, MarkerEntry>>(new Map());
  const propertiesByIdRef = useRef<Map<string, Property>>(new Map());
  const onMarkerClickRef = useRef(onMarkerClick);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    propertiesByIdRef.current = new Map(properties.map((property) => [property.id, property]));
  }, [properties]);

  useEffect(() => {
    if (!map) {
      return undefined;
    }

    let cancelled = false;

    const syncMarkers = async () => {
      const leaflet = await import("leaflet");

      if (cancelled) {
        return;
      }

      const registry = markerRegistryRef.current;
      const visibleIds = new Set<string>();

      for (const property of properties) {
        if (!Number.isFinite(property.lat) || !Number.isFinite(property.lng)) {
          continue;
        }

        visibleIds.add(property.id);
        const existing = registry.get(property.id);

        if (existing) {
          existing.marker.setLatLng([property.lat, property.lng]);
          existing.marker.setIcon(createPropertyIcon(leaflet, property, property.id === highlightedPropertyId));
          continue;
        }

        const marker = leaflet
          .marker([property.lat, property.lng], {
            icon: createPropertyIcon(leaflet, property, property.id === highlightedPropertyId),
            keyboard: true,
          })
          .addTo(map);

        const clickHandler = () => {
          const currentProperty = propertiesByIdRef.current.get(property.id);
          if (currentProperty) {
            onMarkerClickRef.current?.(currentProperty);
          }
        };

        marker.on("click", clickHandler);

        registry.set(property.id, {
          marker,
          clickHandler,
        });
      }

      for (const [propertyId, entry] of registry.entries()) {
        if (visibleIds.has(propertyId)) {
          continue;
        }

        entry.marker.off("click", entry.clickHandler);
        entry.marker.remove();
        registry.delete(propertyId);
      }
    };

    void syncMarkers();

    return () => {
      cancelled = true;
    };
  }, [map, properties, highlightedPropertyId]);

  useEffect(() => {
    return () => {
      for (const entry of markerRegistryRef.current.values()) {
        entry.marker.off("click", entry.clickHandler);
        entry.marker.remove();
      }

      markerRegistryRef.current.clear();
    };
  }, []);
}
