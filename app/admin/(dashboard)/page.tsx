import { listAlbums, toSafeAlbum } from "@/lib/albums/service";
import { AlbumList } from "@/components/admin/AlbumList";

export default async function AdminDashboardPage() {
  const albums = await listAlbums({ publicOnly: false });
  return <AlbumList initialAlbums={albums.map(toSafeAlbum)} />;
}
