import { NextResponse } from "next/server";
import { toggleLike } from "@/lib/likes/service";
import { getPhotoWithAlbum } from "@/lib/albums/service";
import { canViewAlbum } from "@/lib/albums/access";
import { getOrSetFingerprint } from "@/lib/fingerprint";
import { clientIp } from "@/lib/client-ip";
import { isRateLimited } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  // Keyed on IP, not the fingerprint cookie — dropping the cookie would otherwise reset the limit.
  if (isRateLimited(`like:${clientIp(req)}`, { max: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const found = await getPhotoWithAlbum(id);
  if (!found || !(await canViewAlbum(found.album))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fingerprint = await getOrSetFingerprint();
  const result = await toggleLike(id, fingerprint);
  return NextResponse.json(result);
}
