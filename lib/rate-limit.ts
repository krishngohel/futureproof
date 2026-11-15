/**
 * Minimal in-memory sliding-window rate limiter.
 * Per-instance only (resets on deploy / doesn't share across serverless
 * instances) — fine for v1 spam protection; swap for Upstash/Redis later.
 */

const buckets = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return true;
  }

  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 5000) {
    Array.from(buckets.entries()).forEach(([k, v]) => {
      if (v.every((t) => t <= cutoff)) buckets.delete(k);
    });
  }
  return false;
}
