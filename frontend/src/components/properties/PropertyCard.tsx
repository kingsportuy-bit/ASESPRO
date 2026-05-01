import Link from "next/link";

import { formatOperationLabel, formatPrice, type PropertyListing } from "@/lib/properties";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";

import styles from "./PropertyCard.module.css";

type PropertyCardProps = {
  property: PropertyListing;
  selected?: boolean;
  onSelect?: (propertyId: string) => void;
};

export function PropertyCard({ property, selected = false, onSelect }: PropertyCardProps): JSX.Element {
  const interactionLabel = `Abrir ${property.title} en ${property.location}`;
  const coverImage = getPropertyCoverImage(property.id);

  return (
    <article className={`${styles.card} ${selected ? styles.cardSelected : ""}`} role="listitem">
      <Link
        href={`/propiedad/${property.id}`}
        className={styles.cardButton}
        onClick={() => onSelect?.(property.id)}
        aria-label={interactionLabel}
      >
        <div className={styles.content}>
          <div className={styles.thumbWrap}>
            <img src={coverImage} alt="" className={styles.thumb} loading="lazy" />
            <span className={styles.operationBadge}>{formatOperationLabel(property)}</span>
          </div>

          <div className={styles.info}>
            <p className={styles.cardTitle}>{property.title}</p>
            <p className={styles.cardMeta}>{property.location}</p>
            <div className={styles.pillRow}>
              <span className={styles.pill}>{property.type}</span>
              <span className={styles.pill}>{property.status}</span>
            </div>
            <p className={styles.price}>{formatPrice(property.price, property.priceCurrency)}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}
