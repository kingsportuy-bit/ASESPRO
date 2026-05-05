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

function getEmbeddedVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname.startsWith("/embed/")) return url;
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    if (host === "player.vimeo.com" || parsed.pathname.includes("/embed/")) {
      return url;
    }
  } catch {
    return null;
  }

  return null;
}

function isSupportedPublicVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (getEmbeddedVideoUrl(url)) return true;

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    return pathname.endsWith(".mp4") || pathname.endsWith(".m3u8");
  } catch {
    return false;
  }
}

export function PropertyMediaGallery({ title, location, photos, videoUrl, fallbackImage }: PropertyMediaGalleryProps): JSX.Element {
  const safeVideoUrl = isSupportedPublicVideoUrl(videoUrl) ? videoUrl : null;
  const embeddedVideoUrl = getEmbeddedVideoUrl(safeVideoUrl);
  const galleryMedia = useMemo(
    () => [...photos.map((src) => ({ type: "photo" as const, src })), ...(safeVideoUrl ? [{ type: "video" as const, src: safeVideoUrl }] : [])],
    [photos, safeVideoUrl],
  );
  const primaryPhoto = photos[0] ?? fallbackImage;
  const sidePhotos = useMemo(() => photos.slice(1, 4), [photos]);
  const extraPhotosCount = Math.max(photos.length - 4, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const videoSourceType = safeVideoUrl?.toLowerCase().includes(".m3u8") ? "application/x-mpegURL" : "video/mp4";
  const videoIndex = safeVideoUrl ? galleryMedia.length - 1 : null;
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
        <div className={styles.galleryActions}>
          <button type="button" className={styles.moreMediaButton} onClick={() => setActiveIndex(0)}>
            Ver fotos
          </button>
          {videoIndex !== null ? (
            <button type="button" className={styles.videoMediaButton} onClick={() => setActiveIndex(videoIndex)}>
              Ver video de la propiedad
            </button>
          ) : null}
        </div>
      </section>

      {activeIndex !== null ? (
        <div className={styles.lightbox} onClick={() => setActiveIndex(null)}>
          <div
            className={`${styles.lightboxMedia} ${activeMedia?.type === "video" ? styles.lightboxMediaVideo : ""} ${
              activeMedia?.type === "video" && embeddedVideoUrl ? styles.lightboxMediaEmbedded : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {activeMedia?.type === "video" ? (
              embeddedVideoUrl ? (
                <iframe
                  src={embeddedVideoUrl}
                  title={`Video de ${title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video controls autoPlay playsInline preload="metadata">
                  <source src={activeMedia.src} type={videoSourceType} />
                </video>
              )
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
