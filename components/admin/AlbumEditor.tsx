"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Photo, SafeAlbum } from "@/lib/albums/service";
import { PhotoUploader } from "./PhotoUploader";
import { PhotoGrid } from "./PhotoGrid";
import styles from "./AlbumEditor.module.css";

export function AlbumEditor({
  album: initialAlbum,
  initialPhotos,
}: {
  album: SafeAlbum;
  initialPhotos: Photo[];
}) {
  const router = useRouter();
  const [album, setAlbum] = useState(initialAlbum);
  const [photos, setPhotos] = useState(initialPhotos);
  const [title, setTitle] = useState(initialAlbum.title);
  const [description, setDescription] = useState(initialAlbum.description ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function patchAlbum(body: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/albums/${album.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const { album: updated } = await res.json();
      setAlbum(updated);
      setSavedAt(Date.now());
    }
    return res.ok;
  }

  async function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault();
    await patchAlbum({ title: title.trim(), description: description.trim() || null });
  }

  async function handleTogglePublic() {
    await patchAlbum({ isPublic: !album.isPublic });
  }

  async function handleToggleHomepage() {
    await patchAlbum({ showOnHomepage: !album.showOnHomepage });
  }

  async function handleSetPassword(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    const ok = await patchAlbum({ password: password.trim() });
    if (ok) setPassword("");
  }

  async function handleClearPassword() {
    await patchAlbum({ password: null });
  }

  async function handleDeleteAlbum() {
    if (!confirm(`Delete "${album.title}" and all its photos? This can't be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/albums/${album.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <Link href="/admin" className={styles.back}>
        ← All albums
      </Link>

      <div className={styles.grid}>
        <section className={styles.settings}>
          <form onSubmit={handleDetailsSubmit} className={styles.detailsForm}>
            <label htmlFor="title">Title</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save details"}
            </button>
            {savedAt && <span className={styles.savedHint}>Saved</span>}
          </form>

          <div className={styles.toggleRow}>
            <span>{album.isPublic ? "Public" : "Private (unlisted)"}</span>
            <button type="button" className="secondary" onClick={handleTogglePublic} disabled={saving}>
              Make {album.isPublic ? "private" : "public"}
            </button>
          </div>

          <div className={styles.toggleRow}>
            <span>
              {album.showOnHomepage ? "Shown at the root URL" : "Not shown at the root URL"}
            </span>
            <button type="button" className="secondary" onClick={handleToggleHomepage} disabled={saving}>
              {album.showOnHomepage ? "Unfeature" : "Show at root (/)"}
            </button>
          </div>

          <div className={styles.passwordBlock}>
            <span>{album.hasPassword ? "Password protected" : "No password set"}</span>
            {album.hasPassword ? (
              <button type="button" className="secondary" onClick={handleClearPassword} disabled={saving}>
                Remove password
              </button>
            ) : (
              <form onSubmit={handleSetPassword} className={styles.passwordForm}>
                <input
                  type="password"
                  placeholder="Set a password…"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" disabled={saving || !password.trim()}>
                  Set
                </button>
              </form>
            )}
          </div>

          <button type="button" className="danger" onClick={handleDeleteAlbum} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete album"}
          </button>
        </section>

        <section className={styles.photosSection}>
          <PhotoUploader
            albumId={album.id}
            onUploaded={(uploaded) => setPhotos((prev) => [...prev, ...uploaded])}
          />
          <PhotoGrid
            albumId={album.id}
            photos={photos}
            onReorder={setPhotos}
            onDelete={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
          />
        </section>
      </div>
    </div>
  );
}
