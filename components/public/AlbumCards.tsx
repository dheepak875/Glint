import Link from "next/link";
import { getCoverPhoto, type Album } from "@/lib/albums/service";
import styles from "./AlbumCards.module.css";

/** Grid of album covers linking to each album. Locked albums get a placeholder cover. */
export async function AlbumCards({ albums }: { albums: Album[] }) {
  const withCovers = await Promise.all(
    albums.map(async (album) => ({
      album,
      // Locked albums' photos are only served to visitors who've unlocked them.
      cover: album.passwordHash ? undefined : await getCoverPhoto(album),
    })),
  );

  if (withCovers.length === 0) {
    return <p className={styles.empty}>No public albums yet.</p>;
  }

  return (
    <ul className={styles.grid}>
      {withCovers.map(({ album, cover }) => (
        <li key={album.id}>
          <Link href={`/${album.slug}`} className={styles.card}>
            <div className={styles.coverWrap}>
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/media/${cover.thumbnailPath}`}
                  alt=""
                  className={styles.cover}
                  style={{ aspectRatio: `${cover.width} / ${cover.height}` }}
                />
              ) : (
                <div className={styles.coverPlaceholder} />
              )}
            </div>
            <div className={styles.cardMeta}>
              <span className={styles.cardTitle}>{album.title}</span>
              {album.description && <span className={styles.cardDescription}>{album.description}</span>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
