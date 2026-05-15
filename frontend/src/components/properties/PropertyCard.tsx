import Link from "next/link";

import { formatOperationLabel, formatPrice, type PropertyListing } from "@/lib/properties";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { PropertyFacts } from "./PropertyFacts";

import styles from "./PropertyCard.module.css";

type PropertyCardProps = {
  property: PropertyListing;
  selected?: boolean;
  onSelect?: (propertyId: string) => void;
};

export function PropertyCard({ property, selected = false, onSelect }: PropertyCardProps): JSX.Element {
  const interactionLabel = `Abrir ${property.title} en ${property.location}`;
  const coverMedia = property.media?.find((item) => item.type === "photo" && item.url.trim().length > 0);
  const coverImage = coverMedia?.url ?? property.photoUrls.find((photo) => photo.trim().length > 0) ?? getPropertyCoverImage(property.id);
  const objectPosition = `${coverMedia?.focalX ?? 50}% ${coverMedia?.focalY ?? 50}%`;

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
            <img
              src={coverImage}
              alt=""
              className={styles.thumb}
              style={{ objectPosition }}
              loading="lazy"
              onError={(event) => {
                const fallback = getPropertyCoverImage(property.id);
                if (event.currentTarget.src !== fallback) {
                  event.currentTarget.src = fallback;
                }
              }}
            />
            <span className={styles.operationBadge}>{formatOperationLabel(property)}</span>
          </div>

          <div className={styles.info}>
            <p className={styles.cardTitle}>{property.title}</p>
            <p className={styles.cardMeta}>{property.location}</p>
            <PropertyFacts property={property} compact />
            <p className={styles.price}>{formatPrice(property.price, property.priceCurrency)}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}
