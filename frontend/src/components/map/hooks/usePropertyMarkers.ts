import { useEffect, useRef } from "react";
import type { DivIcon, Map as LeafletMap, Marker as LeafletMarker, Tooltip as LeafletTooltip } from "leaflet";

import { renderPropertyMarkerHtml, renderPropertyPreviewHtml } from "../PropertyMarker";
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
  mouseOverHandler: () => void;
  mouseOutHandler: () => void;
};

type ActivePreview = {
  propertyId: string;
  tooltip: LeafletTooltip;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (event: MouseEvent) => void;
};

const ASESPRO_OFFICE = {
  // Geocoded from: Florencio Sanchez 722, Paso de los Toros (UY)
  lat: -32.8100311,
  lng: -56.5120447,
};

const DEFAULT_ICON_SIZE: [number, number] = [68, 38];
const DEFAULT_ICON_ANCHOR: [number, number] = [34, 38];
const PREVIEW_CLOSE_DELAY_MS = 225;
const PREVIEW_WIDTH_PX = 218;
const PREVIEW_EDGE_PADDING_PX = 36;

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
  const officeMarkerRef = useRef<LeafletMarker | null>(null);
  const activePreviewRef = useRef<ActivePreview | null>(null);
  const closePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

      const clearPreviewTimer = () => {
        if (!closePreviewTimerRef.current) {
          return;
        }

        clearTimeout(closePreviewTimerRef.current);
        closePreviewTimerRef.current = null;
      };

      const closeActivePreview = () => {
        clearPreviewTimer();
        const active = activePreviewRef.current;
        if (!active) {
          return;
        }

        const element = active.tooltip.getElement();
        element?.removeEventListener("mouseenter", active.onMouseEnter);
        element?.removeEventListener("mouseleave", active.onMouseLeave);
        element?.removeEventListener("click", active.onClick);
        active.tooltip.remove();
        activePreviewRef.current = null;
      };

      const scheduleCloseActivePreview = () => {
        clearPreviewTimer();
        closePreviewTimerRef.current = setTimeout(() => {
          closeActivePreview();
        }, PREVIEW_CLOSE_DELAY_MS);
      };

      const openPropertyPreview = (property: Property) => {
        clearPreviewTimer();
        if (activePreviewRef.current?.propertyId === property.id) {
          return;
        }

        closeActivePreview();
        const markerPoint = map.latLngToContainerPoint([property.lat, property.lng]);
        const mapSize = map.getSize();
        const opensLeft = markerPoint.x > mapSize.x - PREVIEW_WIDTH_PX - PREVIEW_EDGE_PADDING_PX;
        const tooltip = leaflet
          .tooltip({
            className: "asespro-property-tooltip",
            direction: opensLeft ? "left" : "right",
            interactive: true,
            opacity: 1,
            permanent: true,
            offset: opensLeft ? [-30, -74] : [30, -74],
          })
          .setLatLng([property.lat, property.lng])
          .setContent(renderPropertyPreviewHtml(property))
          .addTo(map);

        const onMouseEnter = () => clearPreviewTimer();
        const onMouseLeave = () => scheduleCloseActivePreview();
        const onClick = (event: MouseEvent) => {
          const target = event.target instanceof Element ? event.target : null;
          const control = target?.closest("[data-preview-direction]");
          if (control instanceof HTMLElement) {
            event.preventDefault();
            event.stopPropagation();
            const gallery = control.closest("[data-preview-gallery]");
            const images = gallery ? Array.from(gallery.querySelectorAll<HTMLElement>("[data-preview-image]")) : [];
            if (!gallery || images.length === 0) {
              return;
            }

            const currentIndex = Number(gallery.getAttribute("data-active-index") ?? "0");
            const direction = control.getAttribute("data-preview-direction");
            const nextIndex =
              direction === "prev"
                ? (currentIndex - 1 + images.length) % images.length
                : (currentIndex + 1) % images.length;

            gallery.setAttribute("data-active-index", String(nextIndex));
            images.forEach((image, index) => {
              image.style.opacity = index === nextIndex ? "1" : "0";
            });
            return;
          }

          const card = target?.closest("[data-property-preview-card]");
          if (card instanceof HTMLElement) {
            const url = card.dataset.propertyUrl;
            if (url) {
              window.open(url, "_blank", "noopener,noreferrer");
            }
          }
        };
        activePreviewRef.current = {
          propertyId: property.id,
          tooltip,
          onMouseEnter,
          onMouseLeave,
          onClick,
        };

        window.setTimeout(() => {
          const element = tooltip.getElement();
          element?.addEventListener("mouseenter", onMouseEnter);
          element?.addEventListener("mouseleave", onMouseLeave);
          element?.addEventListener("click", onClick);
        }, 0);
      };

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
        const mouseOverHandler = () => {
          const currentProperty = propertiesByIdRef.current.get(property.id);
          if (currentProperty) {
            openPropertyPreview(currentProperty);
          }
        };
        const mouseOutHandler = () => {
          scheduleCloseActivePreview();
        };

        marker.on("click", clickHandler);
        marker.on("mouseover", mouseOverHandler);
        marker.on("mouseout", mouseOutHandler);

        registry.set(property.id, {
          marker,
          clickHandler,
          mouseOverHandler,
          mouseOutHandler,
        });
      }

      for (const [propertyId, entry] of registry.entries()) {
        if (visibleIds.has(propertyId)) {
          continue;
        }

        entry.marker.off("click", entry.clickHandler);
        entry.marker.off("mouseover", entry.mouseOverHandler);
        entry.marker.off("mouseout", entry.mouseOutHandler);
        if (activePreviewRef.current?.propertyId === propertyId) {
          closeActivePreview();
        }
        entry.marker.remove();
        registry.delete(propertyId);
      }

      if (!officeMarkerRef.current) {
        const officeIcon = leaflet.divIcon({
          html: '<div style="width:34px;height:34px;border-radius:999px;background:#fff;padding:6px;box-shadow:0 6px 16px rgba(0,0,0,.18);display:grid;place-items:center;"><img src="/LOGO_ASESPRO_transparente_horizontal_moible%20-%20mapa.png" alt="" aria-hidden="true" style="width:100%;height:100%;object-fit:contain;" /></div>',
          className: "asespro-office-marker",
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });
        officeMarkerRef.current = leaflet.marker([ASESPRO_OFFICE.lat, ASESPRO_OFFICE.lng], { icon: officeIcon }).addTo(map);
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
        entry.marker.off("mouseover", entry.mouseOverHandler);
        entry.marker.off("mouseout", entry.mouseOutHandler);
        entry.marker.remove();
      }

      if (closePreviewTimerRef.current) {
        clearTimeout(closePreviewTimerRef.current);
        closePreviewTimerRef.current = null;
      }
      activePreviewRef.current?.tooltip.remove();
      activePreviewRef.current = null;
      markerRegistryRef.current.clear();
      officeMarkerRef.current?.remove();
      officeMarkerRef.current = null;
    };
  }, []);
}
