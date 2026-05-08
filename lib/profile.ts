import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

function normalize(raw: any): Profile | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: raw.id,
    email: raw.email ?? null,
    plan: raw.plan === "pro" ? "pro" : "free",
    stripe_customer_id: raw.stripe_customer_id ?? null,
    stripe_subscription_id: raw.stripe_subscription_id ?? null,
    searches_used:
      typeof raw.searches_used === "number" && Number.isFinite(raw.searches_used)
        ? raw.searches_used
        : 0,
    searches_reset_at: raw.searches_reset_at ?? new Date(0).toISOString(),
    leads_count:
      typeof raw.leads_count === "number" && Number.isFinite(raw.leads_count)
        ? raw.leads_count
        : 0,
    saved_icp: typeof raw.saved_icp === "string" ? raw.saved_icp : null,
    weekly_digest_enabled: Boolean(raw.weekly_digest_enabled),
    created_at: raw.created_at ?? new Date(0).toISOString()
  };
}

export async function getProfile(): Promise<{ profile: Profile | null; userId: string | null }> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, userId: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { profile: normalize(profile), userId: user.id };
}

export async function requireProfile(): Promise<{ profile: Profile; userId: string }> {
  const { profile, userId } = await getProfile();
  if (!profile || !userId) {
    throw new Error("UNAUTHORIZED");
  }
  return { profile, userId };
}
