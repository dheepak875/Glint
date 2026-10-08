import type { Metadata } from "next";
import { listAlbums } from "@/lib/albums/service";
import { AlbumCards } from "@/components/public/AlbumCards";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Albums" };

export default async function AlbumsPage() {
  const albums = await listAlbums({ publicOnly: true });
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Albums</h1>
      </header>
      <AlbumCards albums={albums} />
    </main>
  );
}
