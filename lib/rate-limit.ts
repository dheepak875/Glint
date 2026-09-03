/**
 * In-memory sliding-window rate limiter. Deliberately not backed by Redis or similar —
 * this app runs as a single process, so a process-local Map is sufficient and keeps the
 * dependency footprint small. Resets on restart, which is an acceptable trade-off here.
 */
const buckets = new Map<string, number[]>();

export function isRateLimited(key: string, opts: { max: number; windowMs: number }): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < opts.windowMs);

  if (recent.length >= opts.max) {
    buckets.set(key, recent);
    return true;
  }

  recent.push(now);
  buckets.set(key, recent);
  return false;
}
