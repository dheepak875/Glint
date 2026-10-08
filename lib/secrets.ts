import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { env } from "@/lib/env";

interface StoredSecrets {
  sessionSecret: string;
  /** Only present when ADMIN_PASSWORD isn't set — generated so a fresh install is never "changeme". */
  adminPassword?: string;
}

declare global {
  var __glintSecrets: StoredSecrets | undefined;
}

const secretsPath = path.join(env.storageRoot, "secrets.json");

/**
 * Secrets the operator didn't configure are generated on first run and persisted in the data
 * volume, so a zero-config install is still secure and sessions survive restarts.
 * Loaded lazily (not at import) so `next build` never touches the data directory.
 */
function loadSecrets(): StoredSecrets {
  let stored: Partial<StoredSecrets> = {};
  try {
    stored = JSON.parse(fs.readFileSync(secretsPath, "utf8"));
  } catch {
    // First run (or unreadable file) — generate below.
  }

  const next: StoredSecrets = {
    sessionSecret: stored.sessionSecret ?? randomBytes(32).toString("base64url"),
    adminPassword: stored.adminPassword,
  };
  if (!env.adminPassword && !next.adminPassword) {
    next.adminPassword = randomBytes(12).toString("base64url");
    console.log(
      [
        "",
        "  Glint: no ADMIN_PASSWORD set, so one was generated for you.",
        `    username: ${env.adminUsername}`,
        `    password: ${next.adminPassword}`,
        `  It's saved in ${secretsPath}. Set ADMIN_PASSWORD to use your own.`,
        "",
      ].join("\n"),
    );
  }

  if (next.sessionSecret !== stored.sessionSecret || next.adminPassword !== stored.adminPassword) {
    fs.mkdirSync(path.dirname(secretsPath), { recursive: true });
    fs.writeFileSync(secretsPath, JSON.stringify(next, null, 2), { mode: 0o600 });
  }
  return next;
}

function getSecrets(): StoredSecrets {
  globalThis.__glintSecrets ??= loadSecrets();
  return globalThis.__glintSecrets;
}

export function getSessionSecret(): string {
  return env.sessionSecret ?? getSecrets().sessionSecret;
}

export function getAdminPassword(): string {
  return env.adminPassword ?? getSecrets().adminPassword!;
}
