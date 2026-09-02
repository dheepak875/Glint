"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type { Photo } from "@/lib/albums/service";
import styles from "./PhotoUploader.module.css";

export function PhotoUploader({
  albumId,
  onUploaded,
}: {
  albumId: string;
  onUploaded: (photos: Photo[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (const file of imageFiles) formData.append("files", file);

    const res = await fetch(`/api/albums/${albumId}/photos`, { method: "POST", body: formData });
    setUploading(false);

    if (!res.ok) {
      setError("Upload failed. Try again.");
      return;
    }

    const { photos } = await res.json();
    onUploaded(photos);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      void uploadFiles(e.target.files);
    }
    e.target.value = "";
  }

  return (
    <div>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        {uploading ? "Uploading…" : "Drag photos here, or click to browse"}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className={styles.hiddenInput}
        aria-hidden="true"
        tabIndex={-1}
      />
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  );
}
