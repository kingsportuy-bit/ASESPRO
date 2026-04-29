"use client";

import { useMemo, useState } from "react";
import styles from "./PropertyDetailPage.module.css";

type PropertyMediaGalleryProps = {
  title: string;
  location: string;
  photos: string[];
  videoUrl?: string | null;
};

export function PropertyMediaGallery({ title, location, photos, videoUrl }: PropertyMediaGalleryProps): JSX.Element {
  const media = useMemo(
    () => [
      ...photos.map((src) => ({ type: "photo" as const, src })),
      ...(videoUrl ? [{ type: "video" as const, src: videoUrl }] : []),
    ],
    [photos, videoUrl],
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (media.length === 0) return <section className={styles.gallery} />;

  return (
    <>
      <section className={styles.gallery}>
        <article className={styles.mainMedia} onClick={() => setActiveIndex(0)}>
          <img src={media[0].src} alt={title} />
          <div className={styles.mainCaption}>
            <h1>{title}</h1>
            <p>{location}</p>
          </div>
        </article>
        <div className={styles.sideGrid}>
          {media.slice(1, 3).map((item, idx) => (
            <article key={`${item.type}-${idx}`} className={styles.sideMedia} onClick={() => setActiveIndex(idx + 1)}>
              <img src={item.src} alt="" />
              {item.type === "video" ? <span className={styles.videoBadge}>Video</span> : null}
            </article>
          ))}
        </div>
      </section>

      {activeIndex !== null ? (
        <div className={styles.lightbox} onClick={() => setActiveIndex(null)}>
          <div className={styles.lightboxMedia} onClick={(e) => e.stopPropagation()}>
            {media[activeIndex].type === "video" ? (
              <iframe src={media[activeIndex].src} title={`Video de ${title}`} allowFullScreen />
            ) : (
              <img src={media[activeIndex].src} alt={title} />
            )}
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navBtnPrev}`}
              onClick={() => setActiveIndex((prev) => (prev === null ? 0 : (prev - 1 + media.length) % media.length))}
            >
              {"<"}
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navBtnNext}`}
              onClick={() => setActiveIndex((prev) => (prev === null ? 0 : (prev + 1) % media.length))}
            >
              {">"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
