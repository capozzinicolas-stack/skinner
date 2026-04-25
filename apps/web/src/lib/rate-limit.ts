import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * Rate limiting helper using Upstash Redis.
 *
 * Limits are applied per client IP on public endpoints that consume external
 * API credits (Claude analysis, Gemini projection). Without this, any script
 * could burn a tenant's credits or our Gemini/Claude quota.
 *
 * Limits:
 *   - analysis.run:      10 requests per IP per hour
 *   - /api/projection:    3 requests per IP per hour (more expensive)
 *
 * Returns a no-op limiter when Upstash is not configured (dev / fallback) so
 * that local development does not require Redis.
 */

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

// No-op fallback for local development when Redis is not configured.
function createNoopLimiter(limit: number): {
  limit: (key: string) => Promise<LimitResult>;
} {
  return {
    limit: async () => ({
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + 3600_000,
    }),
  };
}

function createLimiter(limit: number, windowSeconds: number, prefix: string) {
  if (!redisUrl || !redisToken) {
    return createNoopLimiter(limit);
  }

  const redis = new Redis({ url: redisUrl, token: redisToken });

  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix,
    analytics: false,
  });

  return {
    limit: async (key: string): Promise<LimitResult> => {
      const res = await rl.limit(key);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    },
  };
}

// Configured limiters
export const analysisLimiter = createLimiter(10, 3600, "skinner:rl:analysis");
export const projectionLimiter = createLimiter(3, 3600, "skinner:rl:projection");

/**
 * Extract the client IP from common Next.js headers. Falls back to a fixed
 * string so the limiter always has a key.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-vercel-forwarded-for") ??
    "unknown"
  );
}
