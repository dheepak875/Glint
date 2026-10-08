/**
 * Best-effort client IP for rate limiting. Glint is meant to sit behind a reverse proxy or
 * Cloudflare Tunnel, which sets these headers; exposed directly, they're client-controlled,
 * so treat this as a throttle, not an identity.
 */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
