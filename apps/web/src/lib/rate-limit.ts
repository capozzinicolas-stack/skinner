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

/**
 * Extract LGPD-friendly geo data from request headers (city/region/country only —
 * never the raw IP). Vercel and Cloudflare populate these automatically:
 *   - x-vercel-ip-country / cf-ipcountry      → ISO-2 country
 *   - x-vercel-ip-country-region / cf-region  → state or region code
 *   - x-vercel-ip-city / cf-ipcity            → city name (URL-encoded)
 * Returns nulls when running locally or behind a proxy without geo enrichment.
 */
export function getClientGeo(headers: Headers): {
  country: string | null;
  region: string | null;
  city: string | null;
} {
  const decode = (v: string | null): string | null => {
    if (!v) return null;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const country =
    headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? null;
  const region =
    headers.get("x-vercel-ip-country-region") ??
    headers.get("cf-region-code") ??
    headers.get("cf-region") ??
    null;
  const city =
    decode(headers.get("x-vercel-ip-city")) ??
    decode(headers.get("cf-ipcity")) ??
    null;
  return {
    country: country?.toUpperCase() || null,
    region: region?.toUpperCase() || null,
    city: city || null,
  };
}
