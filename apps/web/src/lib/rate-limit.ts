import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * Rate limiting helper using Upstash Redis.
 *
 * Limits are applied per client IP on public endpoints that consume external
 * API credits (Claude analysis, Gemini projection) and on auth/mutation
 * surfaces that can be abused (brute-force login, email spam, runaway scripts).
 *
 * Limits:
 *   - analysis.run:                10 req/IP/hour
 *   - /api/projection:              3 req/IP/hour (more expensive)
 *   - login (credentials):          5 attempts/IP/15min (anti brute-force)
 *   - /api/auth/forgot:             3 req/IP/hour (anti email spam + enum)
 *   - tRPC mutations (tenantProcedure): 60 req/user/min (anti runaway scripts)
 *   - external webhooks (Nuvemshop + Shopify order/product/uninstall):
 *                                  200 req/IP/min (anti flood of fake HMACs)
 *
 * Explicitly NOT rate-limited:
 *   - Stripe webhook: legitimate retry/replay bursts + HMAC verification
 *     + WebhookEvent idempotency table are the actual security controls.
 *   - Nuvemshop customers-data / customers-redact / store-redact: mandatory
 *     LGPD/GDPR compliance webhooks; rate-limiting risks app revocation.
 *   - /api/cron/*: guarded by CRON_SECRET bearer token.
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

// Auth / abuse-prevention limiters (May-2026).
export const loginLimiter = createLimiter(5, 900, "skinner:rl:login");
export const forgotLimiter = createLimiter(3, 3600, "skinner:rl:forgot");

// Mutation limiter for authenticated B2B writes — caps runaway scripts or
// loops without affecting legitimate dashboard flows. Keyed by userId so
// shared NAT IPs don't collide. 60/min = 1 mutation/second average, well
// above any human workflow.
export const mutationLimiter = createLimiter(60, 60, "skinner:rl:mutation");

// External e-commerce webhook limiter. Initial catalog syncs can burst but
// 200/min covers Nuvemshop's max product create rate by ~5x. Excludes Stripe
// + LGPD/GDPR webhooks (see module docstring above).
export const webhookLimiter = createLimiter(200, 60, "skinner:rl:webhook");

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
