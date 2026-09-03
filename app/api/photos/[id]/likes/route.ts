import { NextResponse } from "next/server";
import { getLikeCount, hasLiked } from "@/lib/likes/service";
import { getOrSetFingerprint } from "@/lib/fingerprint";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const fingerprint = await getOrSetFingerprint();
  const [count, liked] = await Promise.all([getLikeCount(id), hasLiked(id, fingerprint)]);
  return NextResponse.json({ count, liked });
}
