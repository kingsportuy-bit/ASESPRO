"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { AdminMedia } from "../lib/adminTypes";
import styles from "../AdminPanel.module.css";
import { MediaSection } from "./MediaSection";

function sortMedia(a: AdminMedia, b: AdminMedia): number {
  if (a.is_cover && !b.is_cover) return -1;
  if (!a.is_cover && b.is_cover) return 1;
  return (a.sort_order ?? 0) - (b.sort_order ?? 0);
}

function stableMediaSignature(items: AdminMedia[]): string {
  return JSON.stringify(
    [...items].sort(sortMedia).map((item) => ({
      id: item.id,
      sort_order: item.sort_order ?? 0,
      is_cover: item.is_cover === true,
      is_visible: item.is_visible !== false,
      focal_x: item.focal_x ?? 50,
      focal_y: item.focal_y ?? 50,
      alt_text: item.alt_text ?? "",
      caption: item.caption ?? "",
      quality_status: item.quality_status ?? "pendiente",
    })),
  );
}

function PropertyMediaEditorComponent({
  currentMedia,
  busy,
  onDeleteMedia,
  onSaveMedia,
}: {
  currentMedia: AdminMedia[];
  busy: boolean;
  onDeleteMedia: (mediaId: string) => void;
  onSaveMedia: (items: AdminMedia[]) => void;
}): JSX.Element {
  const [mediaDraft, setMediaDraft] = useState<AdminMedia[]>([]);
  const persistedSignature = useMemo(() => stableMediaSignature(currentMedia), [currentMedia]);
  const draftSignature = useMemo(() => stableMediaSignature(mediaDraft), [mediaDraft]);

  useEffect(() => {
    setMediaDraft([...currentMedia].sort(sortMedia));
  }, [persistedSignature, currentMedia]);

  const sortedMedia = useMemo(() => [...mediaDraft].sort(sortMedia), [mediaDraft]);
  const photoMedia = useMemo(() => sortedMedia.filter((item) => item.media_type === "photo"), [sortedMedia]);
  const videoMedia = useMemo(() => sortedMedia.filter((item) => item.media_type === "video"), [sortedMedia]);
  const mediaHasPendingChanges = draftSignature !== persistedSignature;

  const updateMediaDraft = useCallback((mediaType: "photo" | "video", items: AdminMedia[]): void => {
    setMediaDraft((current) => {
      const normalizedItems = items.map((item, index) => ({
        ...item,
        sort_order: index,
        is_cover: mediaType === "photo" ? index === 0 : false,
      }));
      return [...current.filter((item) => item.media_type !== mediaType), ...normalizedItems].sort(sortMedia);
    });
  }, []);

  const updateMediaItem = useCallback((mediaType: "photo" | "video", item: AdminMedia, updates: Partial<AdminMedia>): void => {
    setMediaDraft((current) => {
      const sourceItems = current.filter((candidate) => candidate.media_type === mediaType).sort(sortMedia);
      const updatedItems = sourceItems.map((candidate) => (candidate.id === item.id ? { ...candidate, ...updates } : candidate));
      const normalizedItems = updatedItems.map((candidate, index) => ({
        ...candidate,
        sort_order: index,
        is_cover: mediaType === "photo" ? index === 0 : false,
      }));
      return [...current.filter((candidate) => candidate.media_type !== mediaType), ...normalizedItems].sort(sortMedia);
    });
  }, []);

  return (
    <div className={styles.fileManager}>
      <div className={styles.fileManagerHead}>
        <div>
          <strong>Editor multimedia</strong>
          <p>Reordena, elegi portada, ajusta foco y guarda todo junto.</p>
        </div>
        <div className={styles.fileManagerActions}>
          <span>{sortedMedia.length} archivos</span>
          <button type="button" className={mediaHasPendingChanges ? styles.primaryButton : styles.disabledSaveButton} disabled={busy || !mediaHasPendingChanges} onClick={() => onSaveMedia(sortedMedia)}>
            {busy ? "Guardando..." : "Guardar multimedia"}
          </button>
        </div>
      </div>
      {sortedMedia.length > 0 ? (
        <div className={styles.fileSections}>
          <MediaSection title="Fotos" mediaType="photo" items={photoMedia} busy={busy} onDeleteMedia={onDeleteMedia} onReorder={(orderedItems) => updateMediaDraft("photo", orderedItems)} onUpdateMedia={updateMediaItem} />
          <MediaSection title="Videos" mediaType="video" items={videoMedia} busy={busy} onDeleteMedia={onDeleteMedia} onReorder={(orderedItems) => updateMediaDraft("video", orderedItems)} onUpdateMedia={updateMediaItem} />
        </div>
      ) : (
        <p className={styles.empty}>Este inmueble todavÃ­a no tiene archivos cargados.</p>
      )}
    </div>
  );
}

export const PropertyMediaEditor = memo(PropertyMediaEditorComponent);
