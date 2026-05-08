import { createAdminClient } from "@/lib/supabase/admin";
import {
  FREE_TIER_LIMITS,
  PRO_TIER_LIMITS,
  type Profile
} from "@/types/database";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface LimitResult {
  allowed: boolean;
  remaining: number;
  reason?: string;
}

/**
 * Check the search-rate limit for a profile.
 * For pro users, if `searches_reset_at` is older than 30 days, reset the counter
 * (both in memory and persisted) before evaluating the limit.
 */
export async function checkSearchLimit(profile: Profile): Promise<LimitResult> {
  let used = profile.searches_used ?? 0;

  if (profile.plan === "pro") {
    const resetAt = profile.searches_reset_at
      ? new Date(profile.searches_reset_at).getTime()
      : 0;
    const now = Date.now();
    if (!resetAt || now - resetAt >= THIRTY_DAYS_MS) {
      // Reset the rolling window.
      const admin = createAdminClient();
      const nowIso = new Date(now).toISOString();
      const { error } = await admin
        .from("profiles")
        .update({ searches_used: 0, searches_reset_at: nowIso })
        .eq("id", profile.id);
      if (!error) {
        used = 0;
        profile.searches_used = 0;
        profile.searches_reset_at = nowIso;
      }
    }

    const limit = PRO_TIER_LIMITS.searches;
    const remaining = Math.max(limit - used, 0);
    if (used >= limit) {
      return { allowed: false, remaining: 0, reason: "pro_search_limit" };
    }
    return { allowed: true, remaining };
  }

  // Free plan — lifetime cap, no reset.
  const limit = FREE_TIER_LIMITS.searches;
  const remaining = Math.max(limit - used, 0);
  if (used >= limit) {
    return { allowed: false, remaining: 0, reason: "free_search_limit" };
  }
  return { allowed: true, remaining };
}

/**
 * Check whether the user can save `addCount` additional leads.
 * Pro plan is unlimited; free plan caps total leads in account.
 */
export async function checkLeadLimit(
  profile: Profile,
  addCount: number = 1
): Promise<LimitResult> {
  const current = profile.leads_count ?? 0;

  if (profile.plan === "pro") {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }

  const limit = FREE_TIER_LIMITS.leads;
  const remainingNow = Math.max(limit - current, 0);
  if (current + addCount > limit) {
    return {
      allowed: false,
      remaining: remainingNow,
      reason: "free_lead_limit"
    };
  }
  return { allowed: true, remaining: remainingNow - addCount };
}
