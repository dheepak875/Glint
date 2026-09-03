import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "glint_fp";
const TWO_YEARS_SECONDS = 60 * 60 * 24 * 365 * 2;

/**
 * Anonymous per-visitor id for likes/comments — not an auth credential, just enough to
 * dedupe one like per person per photo and attribute comments for rate limiting.
 */
export async function getOrSetFingerprint(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const fingerprint = randomUUID();
  store.set(COOKIE_NAME, fingerprint, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TWO_YEARS_SECONDS,
  });
  return fingerprint;
}
