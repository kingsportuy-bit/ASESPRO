import Link from "next/link";

import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { formatOperationLabel, formatPrice, type PropertyListing } from "@/lib/properties";
import { PropertyFacts } from "./PropertyFacts";

import styles from "./PropertyShowcaseGrid.module.css";

type PropertyShowcaseGridProps = {
  title: string;
  hint: string;
  chipLabel: string;
  properties: PropertyListing[];
};

export function PropertyShowcaseGrid({ title, hint, chipLabel, properties }: PropertyShowcaseGridProps): JSX.Element {
  const visibleProperties = properties.slice(0, 3);

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div>
          <h2>{title}</h2>
          <p>{hint}</p>
        </div>
        <span className={styles.chip}>{chipLabel}</span>
      </div>

      <div className={styles.grid}>
        {visibleProperties.map((property) => (
          <article key={property.id} className={styles.card}>
            <div className={styles.media}>
              <img src={getPropertyCoverImage(property.id)} alt="" loading="lazy" />
              <div className={styles.badgeRow}>
                <span className={styles.badge}>{formatOperationLabel(property)}</span>
                <span className={styles.badge}>{property.type}</span>
              </div>
            </div>

            <div className={styles.body}>
              <p className={styles.price}>{formatPrice(property.price, property.priceCurrency)}</p>
              <h3 className={styles.title}>{property.title}</h3>
              <p className={styles.meta}>{property.location}</p>

              <PropertyFacts property={property} />

              <Link href={`/propiedad/${property.id}`} className={styles.detailLink}>
                Ver detalles
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
