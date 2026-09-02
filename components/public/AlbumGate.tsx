import { listPhotosForAlbum, toSafeAlbum, type Album } from "@/lib/albums/service";
import { getSession } from "@/lib/auth/session";
import { AlbumView } from "./AlbumView";
import { PasswordGate } from "./PasswordGate";

/** Renders an album's gallery, or a password prompt if it's locked for this visitor. */
export async function AlbumGate({ album }: { album: Album }) {
  const session = await getSession();
  const isAdmin = Boolean(session.isAdmin);
  const isUnlocked = (session.unlockedAlbumIds ?? []).includes(album.id);

  if (!isAdmin && album.passwordHash && !isUnlocked) {
    return <PasswordGate albumId={album.id} title={album.title} />;
  }

  const photos = await listPhotosForAlbum(album.id);
  return <AlbumView album={toSafeAlbum(album)} photos={photos} />;
}
