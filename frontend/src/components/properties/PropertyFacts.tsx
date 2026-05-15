import type { PropertyListing } from "@/lib/properties";

import styles from "./PropertyFacts.module.css";

type PropertyFactsProps = {
  property: PropertyListing;
  compact?: boolean;
};

function FactIcon({ type }: { type: "bed" | "bath" | "area" }): JSX.Element {
  if (type === "bed") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M9 24h18a7 7 0 0 1 7 7v3h15a8 8 0 0 1 8 8v13h-9v-6H16v6H7V16h9v18h13v-3a2 2 0 0 0-2-2H9v-5Z" />
      </svg>
    );
  }

  if (type === "bath") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M15 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8v5h-8v-5h-2v22h34v8h-5v3a13 13 0 0 1-13 13H25a13 13 0 0 1-13-13v-3H7v-8h8V12Zm6 30v3a5 5 0 0 0 5 5h12a5 5 0 0 0 5-5v-3H21Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M12 12h40v40H12V12Zm8 8v24h24V20H20Zm14-14h18v18h-7v-6H34V6ZM6 34h12v7h-5v11H6V34Z" />
    </svg>
  );
}

export function PropertyFacts({ property, compact = false }: PropertyFactsProps): JSX.Element {
  const facts = [
    { type: "bed" as const, value: property.bedrooms ?? "--", label: "Dormitorios" },
    { type: "bath" as const, value: property.bathrooms ?? "--", label: "Baños" },
    { type: "area" as const, value: property.areaM2 ? `${property.areaM2} m2` : "N/D", label: "Metros" },
  ];

  return (
    <div className={`${styles.facts} ${compact ? styles.factsCompact : ""}`}>
      {facts.map((fact) => (
        <span key={fact.type} className={styles.fact}>
          <FactIcon type={fact.type} />
          <strong>{fact.value}</strong>
          <small>{fact.label}</small>
        </span>
      ))}
    </div>
  );
}
