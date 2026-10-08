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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploading = progress !== null;

  /**
   * One request per photo, in sequence: keeps each request well under Cloudflare's 100MB body
   * limit, lets a Raspberry Pi process one image at a time, and means a single bad file doesn't
   * sink a batch of hundreds.
   */
  async function uploadFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0 || uploading) return;

    setFailed([]);
    setProgress({ done: 0, total: imageFiles.length });

    for (const [i, file] of imageFiles.entries()) {
      const formData = new FormData();
      formData.append("files", file);
      try {
        const res = await fetch(`/api/albums/${albumId}/photos`, { method: "POST", body: formData });
        if (!res.ok) throw new Error();
        const { photos } = await res.json();
        onUploaded(photos);
      } catch {
        setFailed((prev) => [...prev, file.name]);
      }
      setProgress({ done: i + 1, total: imageFiles.length });
    }

    setProgress(null);
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
        {progress
          ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…`
          : "Drag photos here, or click to browse"}
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
      {progress && (
        <progress className={styles.progress} value={progress.done} max={progress.total} />
      )}
      {failed.length > 0 && (
        <p role="alert" className={styles.error}>
          {failed.length === 1 ? "1 photo" : `${failed.length} photos`} failed to upload:{" "}
          {failed.join(", ")}
        </p>
      )}
    </div>
  );
}
