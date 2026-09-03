import { randomUUID } from "node:crypto";
import { and, count as sqlCount, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { likes } from "@/lib/db/schema";

export async function getLikeCount(photoId: string): Promise<number> {
  const rows = await db.select({ value: sqlCount() }).from(likes).where(eq(likes.photoId, photoId));
  return rows[0]?.value ?? 0;
}

export async function hasLiked(photoId: string, fingerprint: string): Promise<boolean> {
  const rows = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.photoId, photoId), eq(likes.fingerprint, fingerprint)));
  return rows.length > 0;
}

export async function toggleLike(
  photoId: string,
  fingerprint: string,
): Promise<{ liked: boolean; count: number }> {
  const alreadyLiked = await hasLiked(photoId, fingerprint);

  if (alreadyLiked) {
    await db.delete(likes).where(and(eq(likes.photoId, photoId), eq(likes.fingerprint, fingerprint)));
  } else {
    await db
      .insert(likes)
      .values({ id: randomUUID(), photoId, fingerprint })
      .onConflictDoNothing();
  }

  const count = await getLikeCount(photoId);
  return { liked: !alreadyLiked, count };
}
