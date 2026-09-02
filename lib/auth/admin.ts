import { env } from "@/lib/env";
import { hashPassword, verifyPassword } from "./password";

declare global {
  // eslint-disable-next-line no-var
  var __glintAdminPasswordHash: Promise<string> | undefined;
}

/** Hashes the configured ADMIN_PASSWORD once per process, so login checks never compare plaintext. */
function getAdminPasswordHash(): Promise<string> {
  if (!globalThis.__glintAdminPasswordHash) {
    globalThis.__glintAdminPasswordHash = hashPassword(env.adminPassword);
  }
  return globalThis.__glintAdminPasswordHash;
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  if (username !== env.adminUsername) return false;
  const hash = await getAdminPasswordHash();
  return verifyPassword(password, hash);
}
