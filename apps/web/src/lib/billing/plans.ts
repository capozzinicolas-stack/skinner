/**
 * Plan registry — backed by the `plans` Postgres table managed via /admin/planos.
 *
 * Replaces the previous hardcoded PLANS dictionary. Source of truth lives in
 * the DB so the admin can change pricing/limits/features without a deploy.
 *
 * Cache contract:
 *   - 60-second in-memory TTL per plan + per "all plans" listing.
 *   - Process-local (each Vercel serverless instance has its own cache; cross-
 *     instance staleness is bounded to the TTL — acceptable for an MVP).
 *   - The /admin/planos save endpoint MUST call invalidatePlanCache() so the
 *     same instance that did the save returns fresh data immediately.
 *
 * Grandfathering rules — read carefully before editing consumers:
 *   - features / name / ctaText: read live from this row → visual changes
 *     propagate to existing tenants automatically.
 *   - monthlyPriceBRL / setupFeeBRL: only used for /planos display + new
 *     signups. Existing tenants keep their old Stripe Price (handled by
 *     Stripe at the subscription layer, not by us).
 *   - analysisLimit / commissionRate / maxUsers / excessCostPerAnalysis:
 *     SNAPSHOTTED at signup into Tenant.* columns. Changing them on the Plan
 *     does NOT propagate to existing tenants unless the admin explicitly opts
 *     in via the apply-to-existing checkbox (which fires a separate UPDATE).
 */

import { db } from "@skinner/db";

export type Plan = {
  id: string;
  name: string;
  monthlyPriceBRL: number;
  setupFeeBRL: number | null;
  analysisLimit: number;
  commissionRate: number;
  excessCostPerAnalysis: number;
  maxUsers: number;
  features: string[];
  ctaText: string;
  stripePriceId: string | null;
  stripeSetupPriceId: string | null;
  visible: boolean;
  deprecated: boolean;
  customAllowed: boolean;
  displayOrder: number;
};

// Lightweight string alias kept for source compatibility with the previous
// `PlanId = "growth" | "pro" | "enterprise"` literal union. Now any string
// (admin-created plans) is valid.
export type PlanId = string;

const TTL_MS = 60_000;

type CacheEntry<T> = { value: T; expiresAt: number };
const planCache = new Map<string, CacheEntry<Plan>>();
let allPlansCache: CacheEntry<Plan[]> | null = null;

function fromRow(row: {
  id: string;
  name: string;
  monthlyPriceBRL: number;
  setupFeeBRL: number | null;
  analysisLimit: number;
  commissionRate: number;
  excessCostPerAnalysis: number;
  maxUsers: number;
  features: string;
  ctaText: string;
  stripePriceId: string | null;
  stripeSetupPriceId: string | null;
  visible: boolean;
  deprecated: boolean;
  customAllowed: boolean;
  displayOrder: number;
}): Plan {
  let features: string[] = [];
  try {
    const parsed = JSON.parse(row.features);
    if (Array.isArray(parsed)) {
      features = parsed.filter((f): f is string => typeof f === "string");
    }
  } catch {
    // Malformed JSON — return empty list rather than crashing the page.
    features = [];
  }
  return {
    id: row.id,
    name: row.name,
    monthlyPriceBRL: row.monthlyPriceBRL,
    setupFeeBRL: row.setupFeeBRL,
    analysisLimit: row.analysisLimit,
    commissionRate: row.commissionRate,
    excessCostPerAnalysis: row.excessCostPerAnalysis,
    maxUsers: row.maxUsers,
    features,
    ctaText: row.ctaText,
    stripePriceId: row.stripePriceId,
    stripeSetupPriceId: row.stripeSetupPriceId,
    visible: row.visible,
    deprecated: row.deprecated,
    customAllowed: row.customAllowed,
    displayOrder: row.displayOrder,
  };
}

export async function getPlan(id: string): Promise<Plan | null> {
  const now = Date.now();
  const cached = planCache.get(id);
  if (cached && cached.expiresAt > now) return cached.value;

  const row = await db.plan.findUnique({ where: { id } });
  if (!row) return null;
  const plan = fromRow(row);
  planCache.set(id, { value: plan, expiresAt: now + TTL_MS });
  return plan;
}

export async function getAllPlans(opts?: {
  visibleOnly?: boolean;
  includeDeprecated?: boolean;
}): Promise<Plan[]> {
  const now = Date.now();
  if (allPlansCache && allPlansCache.expiresAt > now) {
    return filterPlans(allPlansCache.value, opts);
  }
  const rows = await db.plan.findMany({ orderBy: { displayOrder: "asc" } });
  const all = rows.map(fromRow);
  allPlansCache = { value: all, expiresAt: now + TTL_MS };
  // Warm the per-id cache too.
  for (const p of all) {
    planCache.set(p.id, { value: p, expiresAt: now + TTL_MS });
  }
  return filterPlans(all, opts);
}

function filterPlans(
  all: Plan[],
  opts?: { visibleOnly?: boolean; includeDeprecated?: boolean }
): Plan[] {
  return all.filter((p) => {
    if (opts?.visibleOnly !== false && !p.visible) return false;
    if (!opts?.includeDeprecated && p.deprecated) return false;
    return true;
  });
}

export async function getPlanForPrice(stripePriceId: string): Promise<Plan | null> {
  // Don't cache by priceId — it's edited rarely but lookups happen in webhook
  // handlers where staleness could mis-route an event. Always read fresh.
  const row = await db.plan.findFirst({ where: { stripePriceId } });
  if (!row) return null;
  return fromRow(row);
}

export function invalidatePlanCache(id?: string): void {
  if (id) {
    planCache.delete(id);
  } else {
    planCache.clear();
  }
  allPlansCache = null;
}
