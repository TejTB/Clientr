export type LeadStatus =
  | "new"
  | "outreach_sent"
  | "followed_up"
  | "replied"
  | "won"
  | "lost";

export type Plan = "free" | "pro";

export interface Profile {
  id: string;
  email: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  searches_used: number;
  searches_reset_at: string;
  leads_count: number;
  saved_icp: string | null;
  weekly_digest_enabled: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  company_name: string;
  industry: string | null;
  location: string | null;
  website: string | null;
  instagram: string | null;
  contact_name: string | null;
  contact_email: string | null;
  status: LeadStatus;
  outreach_copy: string | null;
  follow_up_copy: string | null;
  notes: string | null;
  fit_reason: string | null;
  fit_score: number | null;
  follower_range: string | null;
  website_platform: string | null;
  why_now: string | null;
  red_flags: string | null;
  icp_query: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ProspectResult {
  company_name: string;
  industry: string;
  location: string;
  website: string;
  instagram: string;
  follower_range: string;
  website_platform: string;
  fit_reason: string;
  why_now: string;
  outreach_copy: string;
  fit_score: number;
  red_flags: string;
}

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "outreach_sent",
  "followed_up",
  "replied",
  "won",
  "lost"
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  outreach_sent: "Outreach Sent",
  followed_up: "Followed Up",
  replied: "Replied",
  won: "Won",
  lost: "Lost"
};

export const FREE_TIER_LIMITS = {
  searches: 3,
  leads: 10
} as const;

export const PRO_TIER_LIMITS = {
  searches: 20,
  leads: Number.POSITIVE_INFINITY
} as const;

export function fitScoreTone(score: number | null | undefined): "good" | "ok" | "bad" | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score >= 8) return "good";
  if (score >= 6) return "ok";
  return "bad";
}
