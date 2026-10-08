import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/admin/LogoutButton";
import styles from "./layout.module.css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/admin" className={styles.brand}>
          Glint Admin
        </Link>
        <nav className={styles.nav}>
          <Link href="/admin">Albums</Link>
          <Link href="/admin/settings">Settings</Link>
          <Link href="/" target="_blank">
            View site
          </Link>
          <LogoutButton />
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
