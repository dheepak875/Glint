import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session.isAdmin) {
    redirect("/admin/login");
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Admin dashboard</h1>
      <p>Album management UI lands in a later build phase.</p>
    </main>
  );
}
