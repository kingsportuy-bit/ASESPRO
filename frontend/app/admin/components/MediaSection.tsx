"use client";

import { useState } from "react";
import type { AdminMedia } from "../lib/adminTypes";
import { getObjectPosition, reorderMediaItems } from "../lib/adminUtils";
import styles from "../AdminPanel.module.css";

export function MediaSection({
  title,
  mediaType,
  items,
  busy,
  onDeleteMedia,
  onReorder,
  onUpdateMedia,
}: {
  title: string;
  mediaType: "photo" | "video";
  items: AdminMedia[];
  busy: boolean;
  onDeleteMedia: (mediaId: string) => void;
  onReorder: (orderedItems: AdminMedia[]) => void;
  onUpdateMedia: (mediaType: "photo" | "video", item: AdminMedia, updates: Partial<AdminMedia>) => void;
}): JSX.Element {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <section className={styles.fileSection}>
      <div className={styles.fileSectionHead}>
        <strong>{title}</strong>
        <span>{items.length}</span>
      </div>
      {items.length > 0 ? (
        <div className={styles.fileGrid}>
          {items.map((item, index) => (
            <article
              key={item.id}
              className={`${styles.fileTile} ${item.is_visible === false ? styles.fileTileHidden : ""} ${draggingId === item.id ? styles.fileTileDragging : ""}`}
              draggable={!busy}
              onDragStart={() => setDraggingId(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (!draggingId || draggingId === item.id) return;
                onReorder(reorderMediaItems(items, draggingId, item.id));
                setDraggingId(null);
              }}
              onDragEnd={() => setDraggingId(null)}
            >
              <div className={styles.fileThumb}>
                {item.media_type === "video" && item.public_url ? (
                  <video src={item.public_url} controls preload="metadata" />
                ) : item.public_url ? (
                  <img src={item.public_url} alt="" style={{ objectPosition: getObjectPosition(item) }} />
                ) : (
                  <span>Sin vista</span>
                )}
                <small>{item.media_type === "video" ? "MP4" : item.is_cover ? "Principal" : `Foto ${index + 1}`}</small>
              </div>
              <div className={styles.mediaQuickActions}>
                {mediaType === "photo" ? (
                  <button type="button" disabled={busy || item.is_cover === true} onClick={() => onReorder([item, ...items.filter((candidate) => candidate.id !== item.id)])}>
                    Portada
                  </button>
                ) : null}
                <button type="button" disabled={busy} onClick={() => onUpdateMedia(mediaType, item, { is_visible: item.is_visible === false })}>
                  {item.is_visible === false ? "Mostrar" : "Ocultar"}
                </button>
              </div>
              <div className={styles.mediaControls}>
                {mediaType === "photo" ? (
                  <>
                    <label>
                      Foco X
                      <input type="range" min="0" max="100" value={item.focal_x ?? 50} disabled={busy} onChange={(event) => onUpdateMedia(mediaType, item, { focal_x: Number(event.target.value) })} />
                    </label>
                    <label>
                      Foco Y
                      <input type="range" min="0" max="100" value={item.focal_y ?? 50} disabled={busy} onChange={(event) => onUpdateMedia(mediaType, item, { focal_y: Number(event.target.value) })} />
                    </label>
                  </>
                ) : (
                  <span>Video visible en la galería pública cuando la publicación está activa.</span>
                )}
              </div>
              <button type="button" className={styles.dangerButton} disabled={busy} onClick={() => onDeleteMedia(item.id)}>
                Eliminar
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Sin {title.toLowerCase()} cargados.</p>
      )}
    </section>
  );
}
