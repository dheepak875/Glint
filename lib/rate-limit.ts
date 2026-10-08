/**
 * In-memory sliding-window rate limiter. Deliberately not backed by Redis or similar —
 * this app runs as a single process, so a process-local Map is sufficient and keeps the
 * dependency footprint small. Resets on restart, which is an acceptable trade-off here.
 */
const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;
const LONGEST_WINDOW_MS = 60 * 60 * 1000;

export function isRateLimited(key: string, opts: { max: number; windowMs: number }): boolean {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) {
    // Keys are per-IP, so drop stale ones rather than growing forever.
    for (const [k, times] of buckets) {
      if (now - times[times.length - 1] > LONGEST_WINDOW_MS) buckets.delete(k);
    }
  }
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < opts.windowMs);

  if (recent.length >= opts.max) {
    buckets.set(key, recent);
    return true;
  }

  recent.push(now);
  buckets.set(key, recent);
  return false;
}
