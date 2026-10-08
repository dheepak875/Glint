import { getSession, type SessionData } from "@/lib/auth/session";
import type { Album } from "./service";

/** Short tag of the album's current password hash; changes whenever the password does. */
export function passwordTag(passwordHash: string): string {
  return passwordHash.slice(-16);
}

function isUnlocked(session: SessionData, album: Album): boolean {
  if (!album.passwordHash) return true;
  return session.unlockedAlbums?.[album.id] === passwordTag(album.passwordHash);
}

/** Whether the current visitor may see this album's photos (admin, no password, or unlocked). */
export async function canViewAlbum(album: Album): Promise<boolean> {
  if (!album.passwordHash) return true;
  const session = await getSession();
  return Boolean(session.isAdmin) || isUnlocked(session, album);
}
