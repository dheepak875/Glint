"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { SafeAlbum } from "@/lib/albums/service";
import styles from "./AlbumList.module.css";

export function AlbumList({ initialAlbums }: { initialAlbums: SafeAlbum[] }) {
  const [albums, setAlbums] = useState(initialAlbums);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    const res = await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });

    setCreating(false);
    if (!res.ok) {
      setError("Couldn't create the album. Try again.");
      return;
    }

    const { album } = await res.json();
    setAlbums((prev) => [...prev, album]);
    setTitle("");
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Albums</h1>
      </div>

      <form onSubmit={handleCreate} className={styles.createForm}>
        <input
          type="text"
          placeholder="New album title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="New album title"
        />
        <button type="submit" disabled={creating || !title.trim()}>
          {creating ? "Creating…" : "Create album"}
        </button>
      </form>
      {error && <p role="alert" className={styles.error}>{error}</p>}

      {albums.length === 0 ? (
        <p className={styles.empty}>No albums yet. Create your first one above.</p>
      ) : (
        <ul className={styles.list}>
          {albums.map((album) => (
            <li key={album.id} className={styles.row}>
              <Link href={`/admin/albums/${album.id}`} className={styles.rowLink}>
                <span className={styles.rowTitle}>{album.title}</span>
                <span className={styles.rowMeta}>
                  {album.isPublic ? "Public" : "Private"}
                  {album.hasPassword ? " · Password protected" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
