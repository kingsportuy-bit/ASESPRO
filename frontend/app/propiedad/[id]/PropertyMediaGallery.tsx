"use client";

import { useMemo, useState } from "react";
import styles from "./PropertyDetailPage.module.css";

type PropertyMediaGalleryProps = {
  title: string;
  location: string;
  photos: string[];
  videoUrl?: string | null;
  fallbackImage: string;
};

export function PropertyMediaGallery({ title, location, photos, videoUrl, fallbackImage }: PropertyMediaGalleryProps): JSX.Element {
  const galleryMedia = useMemo(
    () => [...photos.map((src) => ({ type: "photo" as const, src })), ...(videoUrl ? [{ type: "video" as const, src: videoUrl }] : [])],
    [photos, videoUrl],
  );
  const photoPreview = useMemo(() => photos.slice(0, 4), [photos]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (galleryMedia.length === 0) return <section className={styles.gallery} />;

  return (
    <>
      <section className={styles.gallery}>
        <div className={styles.galleryHead}>
          <h1>{title}</h1>
          <p>{location}</p>
        </div>
        <div className={styles.photoGrid}>
          {photoPreview.map((src, idx) => (
            <article key={`${src}-${idx}`} className={styles.photoCard} onClick={() => setActiveIndex(idx)}>
              <img
                src={src}
                alt={`${title} foto ${idx + 1}`}
                onError={(event) => {
                  if (event.currentTarget.src !== fallbackImage) {
                    event.currentTarget.src = fallbackImage;
                  }
                }}
              />
            </article>
          ))}
        </div>
        {photos.length > 4 ? <p className={styles.galleryCount}>+{photos.length - 4} fotos adicionales</p> : null}
        <button type="button" className={styles.moreMediaButton} onClick={() => setActiveIndex(0)}>
          Ver mas
        </button>
      </section>
      {videoUrl ? (
        <section className={styles.videoSection}>
          <div className={styles.videoSectionHead}>
            <h2>Video de la propiedad</h2>
          </div>
          <div className={styles.videoPanel}>
            <video controls preload="metadata" src={videoUrl} />
          </div>
        </section>
      ) : null}

      {activeIndex !== null ? (
        <div className={styles.lightbox} onClick={() => setActiveIndex(null)}>
          <div className={styles.lightboxMedia} onClick={(e) => e.stopPropagation()}>
            {galleryMedia[activeIndex].type === "video" ? (
              <video controls autoPlay playsInline preload="metadata" src={galleryMedia[activeIndex].src} />
            ) : (
              <img
                src={galleryMedia[activeIndex].src}
                alt={title}
                onError={(event) => {
                  if (event.currentTarget.src !== fallbackImage) {
                    event.currentTarget.src = fallbackImage;
                  }
                }}
              />
            )}
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navBtnPrev}`}
              onClick={() => setActiveIndex((prev) => (prev === null ? 0 : (prev - 1 + galleryMedia.length) % galleryMedia.length))}
            >
              {"<"}
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navBtnNext}`}
              onClick={() => setActiveIndex((prev) => (prev === null ? 0 : (prev + 1) % galleryMedia.length))}
            >
              {">"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
