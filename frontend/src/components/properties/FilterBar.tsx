import type { PropertyOperation, PropertyType } from "@/lib/properties";

import styles from "./FilterBar.module.css";

type FilterBarProps = {
  showOperationFilter: boolean;
  operationFilter: PropertyOperation | "all";
  onOperationFilterChange: (value: PropertyOperation | "all") => void;
  typeFilter: PropertyType | "all";
  onTypeFilterChange: (value: PropertyType | "all") => void;
  maxPriceInput: string;
  onMaxPriceInputChange: (value: string) => void;
  locationQuery: string;
  onLocationQueryChange: (value: string) => void;
};

export function FilterBar({
  showOperationFilter,
  operationFilter,
  onOperationFilterChange,
  typeFilter,
  onTypeFilterChange,
  maxPriceInput,
  onMaxPriceInputChange,
  locationQuery,
  onLocationQueryChange,
}: FilterBarProps): JSX.Element {
  return (
    <div className={styles.filters} role="search" aria-label="Filtros de propiedades">
      {showOperationFilter ? (
        <label>
          Operacion
          <select value={operationFilter} onChange={(event) => onOperationFilterChange(event.target.value as PropertyOperation | "all")}>
            <option value="all">Todas</option>
            <option value="alquiler">Alquiler</option>
            <option value="venta">Venta</option>
          </select>
        </label>
      ) : null}

      <label>
        Tipo
        <select value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value as PropertyType | "all")}>
          <option value="all">Todos</option>
          <option value="casa">Casa</option>
          <option value="apartamento">Apartamento</option>
          <option value="terreno">Terreno</option>
        </select>
      </label>

      <label>
        Precio maximo (USD)
        <input
          type="number"
          min={0}
          step={100}
          placeholder="Ej: 100000"
          inputMode="numeric"
          value={maxPriceInput}
          onChange={(event) => onMaxPriceInputChange(event.target.value)}
        />
      </label>

      <label className={styles.locationFilter}>
        Ubicacion
        <input
          type="text"
          placeholder="Barrio, ciudad o zona"
          value={locationQuery}
          onChange={(event) => onLocationQueryChange(event.target.value)}
        />
      </label>
    </div>
  );
}
