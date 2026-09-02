import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { env } from "@/lib/env";

export interface SessionData {
  isAdmin?: boolean;
  /** Album ids this visitor has successfully entered the password for. */
  unlockedAlbumIds?: string[];
}

export const sessionOptions: SessionOptions = {
  password: env.sessionSecret,
  cookieName: "glint_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
