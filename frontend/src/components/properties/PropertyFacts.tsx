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
        <path d="M10 18a6 6 0 0 1 6-6h6a9 9 0 0 1 9 9v7h2v-7a9 9 0 0 1 9-9h6a6 6 0 0 1 6 6v12a9 9 0 0 1 6 9v15h-8v-6H12v6H4V39a9 9 0 0 1 6-9V18Zm8 10h9v-7a5 5 0 0 0-5-5h-4v12Zm20 0h10V16h-6a5 5 0 0 0-5 5v7h1ZM12 38v4h40v-4a3 3 0 0 0-3-3H15a3 3 0 0 0-3 3Z" />
      </svg>
    );
  }

  if (type === "bath") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M17 8a7 7 0 0 1 14 0v5h5v7H24V8a2 2 0 0 0-4 0v25h37v7h-4v4a14 14 0 0 1-11 14l1 4H21l1-4A14 14 0 0 1 11 44v-4H7v-7h10V8Zm3 32v4a7 7 0 0 0 7 7h10a7 7 0 0 0 7-7v-4H20Zm20-27h10v7H40v-7Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 8h9v6h-3v36h3v6h-9v-9H4v-8h6V25H4v-8h6V8Zm17 12h27v27H27V20Zm7 20h13V27H34v13Zm0-32h15V4l11 9-11 9v-5H34v5l-11-9 11-9v4Z" />
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
