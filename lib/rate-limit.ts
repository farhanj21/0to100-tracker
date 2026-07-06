/**
 * Best-effort, zero-infrastructure rate limiting — the same sliding-window
 * approach the chat API uses, packaged as a factory so each public route can
 * carry its own window and caps. In-memory on purpose: it costs nothing, and
 * resetting on redeploy/cold start is acceptable for an abuse guard rather
 * than a billing meter.
 */

export interface RateLimiterConfig {
  windowMs: number;
  perClientMax: number;
  globalMax: number;
}

export interface RateLimiter {
  /** Records a hit for the client and reports whether it should be refused. */
  isRateLimited(clientKey: string): boolean;
}

export function createRateLimiter({
  windowMs,
  perClientMax,
  globalMax,
}: RateLimiterConfig): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    isRateLimited(clientKey: string): boolean {
      const now = Date.now();
      let globalCount = 0;
      // Prune expired entries on every call so the map can't grow unbounded.
      for (const [key, times] of hits) {
        const fresh = times.filter((t) => now - t < windowMs);
        if (fresh.length === 0) hits.delete(key);
        else {
          hits.set(key, fresh);
          globalCount += fresh.length;
        }
      }
      const mine = hits.get(clientKey) ?? [];
      if (mine.length >= perClientMax || globalCount >= globalMax) return true;
      mine.push(now);
      hits.set(clientKey, mine);
      return false;
    },
  };
}

/** The client key used across public routes: first hop of x-forwarded-for. */
export function clientKeyFrom(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "local")
    .split(",")[0]
    .trim();
}
