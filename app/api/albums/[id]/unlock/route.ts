import { NextResponse } from "next/server";
import { z } from "zod";
import { getAlbumByIdOrSlug } from "@/lib/albums/service";
import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { passwordTag } from "@/lib/albums/access";
import { clientIp } from "@/lib/client-ip";
import { isRateLimited } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({ password: z.string().min(1) });

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const album = await getAlbumByIdOrSlug(id);
  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!album.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  if (isRateLimited(`unlock:${album.id}:${clientIp(req)}`, { max: 10, windowMs: 15 * 60_000 })) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const isValid = await verifyPassword(parsed.data.password, album.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const session = await getSession();
  session.unlockedAlbums = { ...session.unlockedAlbums, [album.id]: passwordTag(album.passwordHash) };
  await session.save();

  return NextResponse.json({ ok: true });
}
