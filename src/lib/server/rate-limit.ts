/**
 * Rate limiter token-bucket sederhana di memori (per instance server).
 * Cukup untuk MVP; untuk skala besar gunakan penyimpanan bersama (mis. Redis).
 */
interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const refillPerMs = limit / windowMs;
  const bucket = buckets.get(key) ?? { tokens: limit, updatedAt: now };
  bucket.tokens = Math.min(limit, bucket.tokens + (now - bucket.updatedAt) * refillPerMs);
  bucket.updatedAt = now;

  let allowed = false;
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    allowed = true;
  }
  if (buckets.size >= MAX_BUCKETS && !buckets.has(key)) {
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }
  buckets.set(key, bucket);
  return {
    allowed,
    remaining: Math.floor(bucket.tokens),
    retryAfterSeconds: allowed ? 0 : Math.ceil((1 - bucket.tokens) / refillPerMs / 1000),
  };
}

export function resetRateLimits(): void {
  buckets.clear();
}
