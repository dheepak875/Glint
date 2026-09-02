import { notFound } from "next/navigation";
import { getAlbumById, listPhotosForAlbum, toSafeAlbum } from "@/lib/albums/service";
import { AlbumEditor } from "@/components/admin/AlbumEditor";

export default async function AdminAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await getAlbumById(id);
  if (!album) {
    notFound();
  }
  const photos = await listPhotosForAlbum(id);

  return <AlbumEditor album={toSafeAlbum(album)} initialPhotos={photos} />;
}
