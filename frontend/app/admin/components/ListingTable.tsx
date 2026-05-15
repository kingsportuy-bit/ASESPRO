"use client";

import type { PropertyStatus } from "@/lib/properties";
import type { AdminListing, AdminMedia } from "../lib/adminTypes";
import { formatMoney, getListingMedia, getListingQuality, getObjectPosition, operationLabel } from "../lib/adminUtils";
import styles from "../AdminPanel.module.css";

function MediaPreview({ media }: { media: AdminMedia[] }): JSX.Element {
  const photos = media.filter((item) => item.media_type === "photo" && item.public_url).sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const cover = photos[0];
  const video = media.find((item) => item.media_type === "video" && item.public_url);

  return (
    <div className={`${styles.mediaPreview} ${cover?.public_url && video?.public_url ? styles.mediaPreviewWithVideo : ""}`}>
      {cover?.public_url ? <img src={cover.public_url} alt="" style={{ objectPosition: getObjectPosition(cover) }} /> : <span>Sin foto</span>}
      {video?.public_url ? <video src={video.public_url} muted playsInline preload="metadata" /> : null}
    </div>
  );
}

export function ListingTable({
  listings,
  busy,
  onEdit,
  onStatusChange,
  onFeaturedChange,
}: {
  listings: AdminListing[];
  busy: boolean;
  onEdit: (listing: AdminListing) => void;
  onStatusChange: (listing: AdminListing, status: PropertyStatus) => Promise<void>;
  onFeaturedChange: (listing: AdminListing, isFeatured: boolean) => Promise<void>;
}): JSX.Element {
  const sortedListings = [...listings].sort((a, b) => {
    const qualityDiff = getListingQuality(a).score - getListingQuality(b).score;
    if (qualityDiff !== 0) return qualityDiff;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });

  return (
    <section className={styles.tablePanel}>
      <div className={styles.sectionHead}>
        <div>
          <h3>Publicaciones</h3>
          <p>Control editorial, estado web, calidad de media y acciones rápidas.</p>
        </div>
        <span>{listings.length}</span>
      </div>

      <div className={styles.dataTable} role="table" aria-label="Publicaciones">
        <div className={styles.dataTableHead} role="row">
          <span>Publicación</span>
          <span>Operación</span>
          <span>Calidad</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>
        {sortedListings.map((listing) => {
          const media = getListingMedia(listing);
          const photos = media.filter((item) => item.media_type === "photo").length;
          const hasVideo = media.some((item) => item.media_type === "video");
          const quality = getListingQuality(listing);
          const qualityTone = quality.score >= 80 ? styles.qualityGood : quality.score >= 50 ? styles.qualityWarn : styles.qualityBad;

          return (
            <article key={listing.id} className={styles.dataTableRow} role="row">
              <div className={styles.listingIdentity}>
                <MediaPreview media={media} />
                <div className={styles.rowMain}>
                  <strong>{listing.title}</strong>
                  <p>{listing.asespro_properties?.location_text ?? "Sin ubicación"}</p>
                  <small>{photos} fotos - {hasVideo ? "con video" : "sin video"} - {formatMoney(listing.price_amount, listing.price_currency)}</small>
                </div>
              </div>
              <span className={styles.statusMuted}>{operationLabel(listing.asespro_listing_operations)}</span>
              <div className={styles.qualityCell}>
                <div className={styles.qualityTrack}>
                  <span className={qualityTone} style={{ width: `${quality.score}%` }} />
                </div>
                <small>{quality.issues.length > 0 ? quality.issues.slice(0, 3).join(" · ") : "Lista para publicar"}</small>
              </div>
              <div className={styles.statusStack}>
                <select value={listing.status} disabled={busy} onChange={(event) => void onStatusChange(listing, event.target.value as PropertyStatus)}>
                  <option value="activo">Activo</option>
                  <option value="desactivado">Desactivado</option>
                </select>
                <small>{listing.publish_status ?? (listing.status === "activo" ? "publicado" : "pausado")}</small>
              </div>
              <div className={styles.rowActions}>
                <label className={styles.featuredToggle}>
                  <input
                    type="checkbox"
                    checked={listing.is_featured === true}
                    disabled={busy}
                    onChange={(event) => void onFeaturedChange(listing, event.target.checked)}
                  />
                  Destacada
                </label>
                <button type="button" onClick={() => onEdit(listing)}>Editar</button>
              </div>
            </article>
          );
        })}
      </div>
      {listings.length === 0 ? <p className={styles.empty}>No hay publicaciones para estos filtros.</p> : null}
    </section>
  );
}
