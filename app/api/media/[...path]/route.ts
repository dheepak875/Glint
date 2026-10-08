import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { getAlbumById } from "@/lib/albums/service";
import { canViewAlbum } from "@/lib/albums/access";
import { getSession } from "@/lib/auth/session";

type Ctx = { params: Promise<{ path: string[] }> };

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".tiff": "image/tiff",
};

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(_req: Request, ctx: Ctx) {
  const { path: segments } = await ctx.params;
  // Stored layout is <albumId>/<photoId>/<variant>; anything else isn't a photo file.
  if (segments.length !== 3) return notFound();
  const [albumId, , variant] = segments;

  const uploadsRoot = path.resolve(env.uploadsRoot);
  const resolved = path.resolve(uploadsRoot, ...segments);
  if (!resolved.startsWith(uploadsRoot + path.sep)) return notFound();

  const album = await getAlbumById(albumId);
  if (!album || !(await canViewAlbum(album))) return notFound();

  // Originals are kept untouched (EXIF, including GPS location) as the photographer's archive copy.
  // Visitors only ever get the re-encoded variants, which sharp writes without metadata.
  if (variant.startsWith("original") && !(await getSession()).isAdmin) return notFound();

  let data: Buffer;
  try {
    data = await fs.readFile(resolved);
  } catch {
    return notFound();
  }

  const contentType = CONTENT_TYPES[path.extname(resolved).toLowerCase()] ?? "application/octet-stream";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      // Files never change at a given path, but password-protected ones mustn't land in shared
      // caches (e.g. Cloudflare) where they'd be served to visitors who haven't unlocked the album.
      "Cache-Control": album.passwordHash
        ? "private, max-age=86400"
        : "public, max-age=31536000, immutable",
    },
  });
}
