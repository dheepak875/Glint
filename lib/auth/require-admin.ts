import { NextResponse } from "next/server";
import { getSession } from "./session";

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response> | Response;

/** Wraps a Route Handler so it 401s unless the request carries a valid admin session cookie. */
export function requireAdmin<Ctx>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    const session = await getSession();
    if (!session.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(req, ctx);
  };
}
