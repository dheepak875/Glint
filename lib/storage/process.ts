import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "@/lib/env";
import { extractExif, type PhotoExif } from "./exif";

const THUMBNAIL_WIDTH = 400;
const MEDIUM_WIDTH = 1600;
const FORMAT_EXTENSIONS: Record<string, string> = {
  jpeg: ".jpg",
  png: ".png",
  webp: ".webp",
  gif: ".gif",
  avif: ".avif",
  tiff: ".tiff",
};

export interface ProcessedPhoto {
  filename: string;
  /** All paths below are relative to env.uploadsRoot, so they stay portable if STORAGE_PATH moves. */
  storagePath: string;
  thumbnailPath: string;
  mediumPath: string;
  width: number;
  height: number;
  exif: PhotoExif | null;
}

/**
 * Writes the original file untouched (browsers respect embedded EXIF orientation for <img>),
 * plus orientation-normalized thumbnail/medium variants (baked-in rotation so any consumer,
 * including the lightbox's transform-based animation, renders them correctly without relying
 * on EXIF handling).
 */
export async function processAndStorePhoto(opts: {
  albumId: string;
  photoId: string;
  buffer: Buffer;
  originalFilename: string;
}): Promise<ProcessedPhoto> {
  const { albumId, photoId, buffer, originalFilename } = opts;

  const { data: orientedBuffer, info } = await sharp(buffer, { failOn: "none" })
    .rotate()
    .toBuffer({ resolveWithObject: true });

  const ext = extensionFor(originalFilename, info.format);
  const relDir = path.join(albumId, photoId);
  const absDir = path.join(env.uploadsRoot, relDir);
  await fs.mkdir(absDir, { recursive: true });

  const storagePath = path.join(relDir, `original${ext}`);
  const thumbnailPath = path.join(relDir, "thumbnail.jpg");
  const mediumPath = path.join(relDir, "medium.jpg");

  await Promise.all([
    fs.writeFile(path.join(env.uploadsRoot, storagePath), buffer),
    sharp(orientedBuffer)
      .resize({ width: THUMBNAIL_WIDTH })
      .jpeg({ quality: 80 })
      .toFile(path.join(env.uploadsRoot, thumbnailPath)),
    sharp(orientedBuffer)
      .resize({ width: MEDIUM_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(path.join(env.uploadsRoot, mediumPath)),
  ]);

  const exif = await extractExif(buffer);

  return {
    filename: originalFilename,
    storagePath,
    thumbnailPath,
    mediumPath,
    width: info.width,
    height: info.height,
    exif,
  };
}

export async function deletePhotoFiles(albumId: string, photoId: string): Promise<void> {
  const dir = path.join(env.uploadsRoot, albumId, photoId);
  await fs.rm(dir, { recursive: true, force: true });
}

export async function deleteAlbumFiles(albumId: string): Promise<void> {
  const dir = path.join(env.uploadsRoot, albumId);
  await fs.rm(dir, { recursive: true, force: true });
}

function extensionFor(originalFilename: string, detectedFormat: string): string {
  const fromName = path.extname(originalFilename).toLowerCase();
  if (fromName) return fromName;
  return FORMAT_EXTENSIONS[detectedFormat] ?? ".jpg";
}
