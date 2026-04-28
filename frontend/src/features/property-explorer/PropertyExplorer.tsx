"use client";

import { useEffect, useMemo, useState } from "react";

import { Map, type MapBounds } from "@/components/map";
import { FilterBar, PropertyCard } from "@/components/properties";
import type { PropertyListing, PropertyOperation, PropertyType } from "@/lib/properties";

import { isWithinBounds, matchesFilters } from "./filtering";
import styles from "./PropertyExplorer.module.css";

type PropertyExplorerProps = {
  properties: PropertyListing[];
  title: string;
  hint: string;
  initialOperation?: PropertyOperation | "all";
  showOperationFilter?: boolean;
};

export function PropertyExplorer({
  properties,
  title,
  hint,
  initialOperation = "all",
  showOperationFilter = true,
}: PropertyExplorerProps): JSX.Element {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(properties[0]?.id ?? null);
  const [operationFilter, setOperationFilter] = useState<PropertyOperation | "all">(initialOperation);
  const [typeFilter, setTypeFilter] = useState<PropertyType | "all">("all");
  const [maxPriceInput, setMaxPriceInput] = useState<string>("");
  const [locationQuery, setLocationQuery] = useState<string>("");

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const selectedStillExists = properties.some((property) => property.id === selectedId);
    if (!selectedStillExists) {
      setSelectedId(properties[0]?.id ?? null);
    }
  }, [properties, selectedId]);

  const filteredProperties = useMemo(() => {
    const parsedMaxPrice = Number(maxPriceInput);
    const maxPrice = Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0 ? parsedMaxPrice : null;

    return properties.filter((property) => {
      if (!matchesFilters(property, operationFilter, typeFilter, maxPrice, locationQuery)) {
        return false;
      }

      if (!bounds) {
        return true;
      }

      return isWithinBounds(property, bounds);
    });
  }, [bounds, locationQuery, maxPriceInput, operationFilter, properties, typeFilter]);

  const selectedProperty = useMemo<PropertyListing | null>(() => {
    if (!selectedId) {
      return null;
    }

    return properties.find((property) => property.id === selectedId) ?? null;
  }, [properties, selectedId]);

  return (
    <section className={styles.layout}>
      <aside className={styles.panel}>
        <header className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>{title}</h2>
          <p className={styles.panelHint}>{hint}</p>
          <p className={styles.resultCount} aria-live="polite">
            {filteredProperties.length} propiedades visibles
          </p>
        </header>

        <FilterBar
          showOperationFilter={showOperationFilter}
          operationFilter={operationFilter}
          onOperationFilterChange={setOperationFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          maxPriceInput={maxPriceInput}
          onMaxPriceInputChange={setMaxPriceInput}
          locationQuery={locationQuery}
          onLocationQueryChange={setLocationQuery}
        />

        <div className={styles.list} role="list" aria-label="Listado de propiedades filtradas">
          {filteredProperties.map((property) => {
            const selected = property.id === selectedProperty?.id;

            return (
              <PropertyCard
                key={property.id}
                property={property}
                selected={selected}
                onSelect={(propertyId) => setSelectedId(propertyId)}
              />
            );
          })}

          {filteredProperties.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay propiedades para los filtros y area visible del mapa.</p>
            </div>
          ) : null}
        </div>
      </aside>

      <div className={styles.mapArea} role="region" aria-label="Mapa de propiedades">
        <Map
          properties={filteredProperties}
          onBoundsChange={setBounds}
          onMarkerClick={(property) => setSelectedId(property.id)}
          initialCenter={{ lat: -32.822, lng: -56.528 }}
          initialZoom={13}
          minZoom={13}
          maxZoom={18}
          height="100%"
        />
      </div>
    </section>
  );
}


