import { listPhotosForAlbum, toPublicPhoto, toSafeAlbum, type Album } from "@/lib/albums/service";
import { canViewAlbum } from "@/lib/albums/access";
import { AlbumView } from "./AlbumView";
import { PasswordGate } from "./PasswordGate";

/** Renders an album's gallery, or a password prompt if it's locked for this visitor. */
export async function AlbumGate({ album }: { album: Album }) {
  if (!(await canViewAlbum(album))) {
    return <PasswordGate albumId={album.id} title={album.title} />;
  }

  const photos = await listPhotosForAlbum(album.id);
  return <AlbumView album={toSafeAlbum(album)} photos={photos.map(toPublicPhoto)} />;
}
