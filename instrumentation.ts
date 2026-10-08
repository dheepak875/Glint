export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureMigrated } = await import("@/lib/db/client");
    const { getAdminPassword } = await import("@/lib/secrets");
    await ensureMigrated();
    // Generates first-run secrets at boot, so a generated admin password is printed in the startup logs.
    getAdminPassword();
  }
}
