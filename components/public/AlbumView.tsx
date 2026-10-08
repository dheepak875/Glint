"use client";

import { useState } from "react";
import type { PublicPhoto, SafeAlbum } from "@/lib/albums/service";
import { JustifiedGrid } from "./JustifiedGrid";
import { Lightbox } from "./Lightbox";
import styles from "./AlbumView.module.css";

export function AlbumView({ album, photos }: { album: SafeAlbum; photos: PublicPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>{album.title}</h1>
        <p className={styles.meta}>
          {album.description ? `${album.description} · ` : ""}
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </p>
      </header>

      {photos.length === 0 ? (
        <p className={styles.empty}>No photos in this album yet.</p>
      ) : (
        <JustifiedGrid photos={photos} onOpen={setOpenIndex} />
      )}

      <Lightbox
        photos={photos}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </main>
  );
}
