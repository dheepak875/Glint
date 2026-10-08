import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { albums } from "@/lib/db/schema";

/** Top-level paths owned by the app — an album slug matching one would be unreachable. */
const RESERVED_SLUGS = new Set(["admin", "api", "_next", "favicon.ico", "robots.txt", "sitemap.xml"]);

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "album";
}

/** Appends -2, -3, ... until the slug is free. */
export async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;
  while (RESERVED_SLUGS.has(candidate) || (await slugExists(candidate))) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function slugExists(slug: string): Promise<boolean> {
  const rows = await db.select({ id: albums.id }).from(albums).where(eq(albums.slug, slug));
  return rows.length > 0;
}
