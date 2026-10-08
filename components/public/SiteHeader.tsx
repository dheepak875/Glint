import Link from "next/link";
import { NavLinks } from "./NavLinks";
import styles from "./SiteHeader.module.css";

export function SiteHeader({
  title,
  showAlbums,
  showAbout,
}: {
  title: string;
  /** Only needed when the homepage shows a featured album instead of the album list. */
  showAlbums: boolean;
  showAbout: boolean;
}) {
  const links = [
    ...(showAlbums ? [{ href: "/albums", label: "Albums" }] : []),
    ...(showAbout ? [{ href: "/about", label: "About" }] : []),
  ];

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        {title}
      </Link>
      {links.length > 0 && <NavLinks links={links} />}
    </header>
  );
}
