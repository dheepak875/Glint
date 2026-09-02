import { notFound } from "next/navigation";
import { getAlbumByIdOrSlug, listPhotosForAlbum, toSafeAlbum } from "@/lib/albums/service";
import { getSession } from "@/lib/auth/session";
import { AlbumView } from "@/components/public/AlbumView";
import { PasswordGate } from "@/components/public/PasswordGate";

export default async function PublicAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const album = await getAlbumByIdOrSlug(slug);
  if (!album) {
    notFound();
  }

  const session = await getSession();
  const isAdmin = Boolean(session.isAdmin);
  const isUnlocked = (session.unlockedAlbumIds ?? []).includes(album.id);

  if (!isAdmin && album.passwordHash && !isUnlocked) {
    return <PasswordGate albumId={album.id} title={album.title} />;
  }

  const photos = await listPhotosForAlbum(album.id);
  return <AlbumView album={toSafeAlbum(album)} photos={photos} />;
}
