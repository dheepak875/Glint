import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminCredentials } from "@/lib/auth/admin";
import { getSession } from "@/lib/auth/session";
import { clientIp } from "@/lib/client-ip";
import { isRateLimited } from "@/lib/rate-limit";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  if (isRateLimited(`login:${clientIp(req)}`, { max: 10, windowMs: 15 * 60_000 })) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const isValid = await verifyAdminCredentials(username, password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
