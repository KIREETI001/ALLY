// Minimal in-memory sliding-window rate limiter for API routes.
//
// Honest scope note: serverless instances each hold their own window, so this
// is a per-instance floor, not a global guarantee. It stops casual abuse and
// runaway clients today; move to Upstash/Redis when traffic justifies it.
// (Domain-wisdom Seed 8: smallest safe change first.)

const windows = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (windows.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    const retryAfterSec = Math.ceil((hits[0] + windowMs - now) / 1000);
    windows.set(key, hits);
    return { ok: false, retryAfterSec };
  }
  hits.push(now);
  windows.set(key, hits);
  // Opportunistic cleanup to bound memory.
  if (windows.size > 5000) {
    const stale: string[] = [];
    windows.forEach((v, k) => {
      if (v.every((t) => t <= cutoff)) stale.push(k);
    });
    stale.forEach((k) => windows.delete(k));
  }
  return { ok: true, retryAfterSec: 0 };
}
