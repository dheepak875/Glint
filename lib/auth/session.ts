import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { getSessionSecret } from "@/lib/secrets";

export interface SessionData {
  isAdmin?: boolean;
  /** Album id -> a tag of the password hash it was unlocked with, so changing or removing an
   * album's password invalidates earlier unlocks. */
  unlockedAlbums?: Record<string, string>;
}

function sessionOptions(): SessionOptions {
  return {
    password: getSessionSecret(),
    cookieName: "glint_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}
