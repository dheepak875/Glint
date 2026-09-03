import { NextResponse } from "next/server";
import { toggleLike } from "@/lib/likes/service";
import { getOrSetFingerprint } from "@/lib/fingerprint";
import { isRateLimited } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const fingerprint = await getOrSetFingerprint();

  if (isRateLimited(`like:${fingerprint}`, { max: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const result = await toggleLike(id, fingerprint);
  return NextResponse.json(result);
}
