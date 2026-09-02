import { randomUUID } from "node:crypto";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { albums, photos } from "@/lib/db/schema";
import { uniqueSlug } from "./slug";
import { deleteAlbumFiles, deletePhotoFiles, processAndStorePhoto } from "@/lib/storage/process";

export type Album = typeof albums.$inferSelect;
export type Photo = typeof photos.$inferSelect;

/** Strips passwordHash and exposes only whether a password is set. */
export function toSafeAlbum(album: Album) {
  const { passwordHash, ...rest } = album;
  return { ...rest, hasPassword: Boolean(passwordHash) };
}

export type SafeAlbum = ReturnType<typeof toSafeAlbum>;

export async function listAlbums(opts: { publicOnly: boolean }) {
  if (opts.publicOnly) {
    return db.select().from(albums).where(eq(albums.isPublic, true)).orderBy(asc(albums.createdAt));
  }
  return db.select().from(albums).orderBy(asc(albums.createdAt));
}

export async function getAlbumByIdOrSlug(idOrSlug: string): Promise<Album | undefined> {
  const rows = await db
    .select()
    .from(albums)
    .where(or(eq(albums.id, idOrSlug), eq(albums.slug, idOrSlug)));
  return rows[0];
}

export async function getAlbumById(id: string): Promise<Album | undefined> {
  const rows = await db.select().from(albums).where(eq(albums.id, id));
  return rows[0];
}

export async function createAlbum(input: {
  title: string;
  description?: string | null;
  isPublic?: boolean;
}): Promise<Album> {
  const id = randomUUID();
  const slug = await uniqueSlug(input.title);
  const [row] = await db
    .insert(albums)
    .values({
      id,
      title: input.title,
      slug,
      description: input.description ?? null,
      isPublic: input.isPublic ?? true,
    })
    .returning();
  return row;
}

export async function updateAlbum(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    isPublic: boolean;
    coverPhotoId: string | null;
    passwordHash: string | null;
  }>,
): Promise<Album | undefined> {
  const [row] = await db
    .update(albums)
    .set({ ...patch, updatedAt: new Date().toISOString() })
    .where(eq(albums.id, id))
    .returning();
  return row;
}

export async function deleteAlbum(id: string): Promise<void> {
  await db.delete(albums).where(eq(albums.id, id));
  await deleteAlbumFiles(id);
}

export async function listPhotosForAlbum(albumId: string) {
  return db.select().from(photos).where(eq(photos.albumId, albumId)).orderBy(asc(photos.sortOrder));
}

/** Explicit cover photo if set, otherwise the first photo by sort order. */
export async function getCoverPhoto(album: Album): Promise<Photo | undefined> {
  if (album.coverPhotoId) {
    const rows = await db.select().from(photos).where(eq(photos.id, album.coverPhotoId));
    if (rows[0]) return rows[0];
  }
  const rows = await db
    .select()
    .from(photos)
    .where(eq(photos.albumId, album.id))
    .orderBy(asc(photos.sortOrder))
    .limit(1);
  return rows[0];
}

export async function reorderPhotos(albumId: string, orderedPhotoIds: string[]): Promise<void> {
  await Promise.all(
    orderedPhotoIds.map((photoId, index) =>
      db
        .update(photos)
        .set({ sortOrder: index })
        .where(and(eq(photos.id, photoId), eq(photos.albumId, albumId))),
    ),
  );
}

export async function addPhoto(albumId: string, file: File): Promise<Photo> {
  const id = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await processAndStorePhoto({
    albumId,
    photoId: id,
    buffer,
    originalFilename: file.name || "photo.jpg",
  });

  const [{ nextOrder }] = await db
    .select({ nextOrder: sql<number>`coalesce(max(${photos.sortOrder}), -1) + 1` })
    .from(photos)
    .where(eq(photos.albumId, albumId));

  const [row] = await db
    .insert(photos)
    .values({
      id,
      albumId,
      filename: processed.filename,
      storagePath: processed.storagePath,
      thumbnailPath: processed.thumbnailPath,
      mediumPath: processed.mediumPath,
      width: processed.width,
      height: processed.height,
      exifJson: processed.exif as Record<string, unknown> | null,
      sortOrder: nextOrder,
    })
    .returning();
  return row;
}

export async function deletePhoto(photoId: string): Promise<Album | undefined> {
  const [photo] = await db.select().from(photos).where(eq(photos.id, photoId));
  if (!photo) return undefined;
  await db.delete(photos).where(eq(photos.id, photoId));
  await deletePhotoFiles(photo.albumId, photoId);
  return getAlbumById(photo.albumId);
}
