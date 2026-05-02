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
  const primaryPhoto = photos[0] ?? fallbackImage;
  const sidePhotos = useMemo(() => photos.slice(1, 4), [photos]);
  const extraPhotosCount = Math.max(photos.length - 4, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [videoError, setVideoError] = useState(false);
  const activeMedia = activeIndex !== null ? galleryMedia[activeIndex] : null;

  if (galleryMedia.length === 0) return <section className={styles.gallery} />;

  return (
    <>
      <section className={styles.gallery}>
        <div className={styles.galleryHead}>
          <h1>{title}</h1>
          <p>{location}</p>
        </div>
        <div className={styles.mediaLayout}>
          <button type="button" className={styles.primaryPhotoCard} onClick={() => setActiveIndex(0)}>
            <img
              src={primaryPhoto}
              alt={`${title} foto principal`}
              onError={(event) => {
                if (event.currentTarget.src !== fallbackImage) {
                  event.currentTarget.src = fallbackImage;
                }
              }}
            />
            {extraPhotosCount > 0 && sidePhotos.length === 0 ? <span className={styles.moreBadge}>+{extraPhotosCount} fotos</span> : null}
          </button>
          <div className={styles.sidePhotoStack}>
            {sidePhotos.map((src, idx) => (
              <button key={`${src}-${idx + 1}`} type="button" className={styles.sidePhotoCard} onClick={() => setActiveIndex(idx + 1)}>
                <img
                  src={src}
                  alt={`${title} foto ${idx + 2}`}
                  onError={(event) => {
                    if (event.currentTarget.src !== fallbackImage) {
                      event.currentTarget.src = fallbackImage;
                    }
                  }}
                />
                {extraPhotosCount > 0 && idx === sidePhotos.length - 1 ? <span className={styles.moreBadge}>+{extraPhotosCount} fotos</span> : null}
              </button>
            ))}
          </div>
        </div>
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
            <video
              controls
              playsInline
              preload="metadata"
              poster={primaryPhoto}
              onError={() => setVideoError(true)}
              onLoadedData={() => setVideoError(false)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
          {videoError ? <p className={styles.videoError}>No se pudo reproducir el video. Revisa que el MP4 use codec H.264.</p> : null}
        </section>
      ) : null}

      {activeIndex !== null ? (
        <div className={styles.lightbox} onClick={() => setActiveIndex(null)}>
          <div
            className={`${styles.lightboxMedia} ${activeMedia?.type === "video" ? styles.lightboxMediaVideo : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {activeMedia?.type === "video" ? (
              <video controls autoPlay playsInline preload="metadata" poster={primaryPhoto}>
                <source src={activeMedia.src} type="video/mp4" />
              </video>
            ) : (
              <img
                src={activeMedia?.src ?? fallbackImage}
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
