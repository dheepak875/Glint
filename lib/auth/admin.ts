import { env } from "@/lib/env";
import { getAdminPassword } from "@/lib/secrets";
import { hashPassword, verifyPassword } from "./password";

declare global {

  var __glintAdminPasswordHash: Promise<string> | undefined;
}

/** Hashes the admin password once per process, so login checks never compare plaintext. */
function getAdminPasswordHash(): Promise<string> {
  if (!globalThis.__glintAdminPasswordHash) {
    globalThis.__glintAdminPasswordHash = hashPassword(getAdminPassword());
  }
  return globalThis.__glintAdminPasswordHash;
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  // Always run the bcrypt compare so a wrong username isn't distinguishable by response time.
  const passwordOk = await verifyPassword(password, await getAdminPasswordHash());
  return passwordOk && username === env.adminUsername;
}
