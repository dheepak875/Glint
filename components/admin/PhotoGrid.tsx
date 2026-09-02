"use client";

import { useRef, useState } from "react";
import type { Photo } from "@/lib/albums/service";
import styles from "./PhotoGrid.module.css";

export function PhotoGrid({
  albumId,
  photos,
  onReorder,
  onDelete,
}: {
  albumId: string;
  photos: Photo[];
  onReorder: (photos: Photo[]) => void;
  onDelete: (photoId: string) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, overIndex: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === overIndex) return;
    const next = [...photos];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(overIndex, 0, moved);
    dragIndex.current = overIndex;
    onReorder(next);
  }

  async function handleDrop() {
    const current = dragIndex.current;
    dragIndex.current = null;
    if (current === null) return;
    await fetch(`/api/albums/${albumId}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds: photos.map((p) => p.id) }),
    });
  }

  async function handleDelete(photoId: string) {
    if (!confirm("Delete this photo? This can't be undone.")) return;
    setDeletingId(photoId);
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      onDelete(photoId);
    }
  }

  if (photos.length === 0) {
    return <p className={styles.empty}>No photos yet — drop some in above.</p>;
  }

  return (
    <ul className={styles.grid}>
      {photos.map((photo, index) => (
        <li
          key={photo.id}
          className={styles.cell}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media/${photo.thumbnailPath}`}
            alt={photo.filename}
            className={styles.thumb}
            style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
          />
          <button
            type="button"
            className={`danger ${styles.deleteButton}`}
            onClick={() => handleDelete(photo.id)}
            disabled={deletingId === photo.id}
            aria-label={`Delete ${photo.filename}`}
          >
            {deletingId === photo.id ? "…" : "Delete"}
          </button>
        </li>
      ))}
    </ul>
  );
}
