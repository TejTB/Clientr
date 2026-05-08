import { NextResponse } from "next/server";
import { getProfile } from "@/lib/profile";
import { checkLeadLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/types/database";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

function nullIfEmpty(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function clampScore(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(10, Math.round(n)));
}

function templateOutreach(companyName: string, industry: string | null): string {
  const niche = industry?.trim() ? industry.trim().toLowerCase() : "your space";
  return `Hi ${companyName} team, I work with ${niche} brands on their site experience and outreach. Loved what you're building. Would you be open to a 15 minute chat about how the site could land more conversions?`;
}

interface ValidatedProspect {
  company_name: string;
  industry: string | null;
  location: string | null;
  website: string | null;
  instagram: string | null;
  fit_reason: string | null;
  why_now: string | null;
  outreach_copy: string | null;
  fit_score: number | null;
  follower_range: string | null;
  website_platform: string | null;
  red_flags: string | null;
}

export async function POST(req: Request) {
  try {
    const { profile, userId } = await getProfile();
    if (!profile || !userId) {
      console.error("[save] unauthorized — no profile/userId from server session");
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "validation_failed", details: "invalid_json" },
        { status: 400, headers: NO_STORE }
      );
    }

    const prospects = body?.prospects;
    const icpQuery =
      typeof body?.icp_query === "string" ? body.icp_query.trim() : null;

    if (!Array.isArray(prospects) || prospects.length === 0) {
      return NextResponse.json(
        { error: "validation_failed", details: "prospects_required" },
        { status: 400, headers: NO_STORE }
      );
    }

    const validated: ValidatedProspect[] = [];
    for (const raw of prospects) {
      if (!raw || typeof raw !== "object") {
        return NextResponse.json(
          { error: "validation_failed", details: "prospect_not_object" },
          { status: 400, headers: NO_STORE }
        );
      }
      const company_name =
        typeof raw.company_name === "string" ? raw.company_name.trim() : "";
      if (!company_name) {
        return NextResponse.json(
          { error: "validation_failed", details: "company_name_required" },
          { status: 400, headers: NO_STORE }
        );
      }
      const industry = nullIfEmpty(raw.industry);
      // Never save a lead with no outreach copy. If Claude returned null,
      // fall back to a template using company name + industry.
      const outreachCopy =
        nullIfEmpty(raw.outreach_copy) ??
        templateOutreach(company_name, industry);
      validated.push({
        company_name,
        industry,
        location: nullIfEmpty(raw.location),
        website: nullIfEmpty(raw.website),
        instagram: nullIfEmpty(raw.instagram),
        fit_reason: nullIfEmpty(raw.fit_reason ?? raw.why_theyre_a_fit),
        why_now: nullIfEmpty(raw.why_now),
        outreach_copy: outreachCopy,
        fit_score: clampScore(raw.fit_score),
        follower_range: nullIfEmpty(raw.follower_range),
        website_platform: nullIfEmpty(raw.website_platform),
        red_flags: nullIfEmpty(raw.red_flags)
      });
    }

    const limit = await checkLeadLimit(profile, validated.length);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "limit_reached", limit_type: "leads", plan: profile.plan },
        { status: 402, headers: NO_STORE }
      );
    }

    const supabase = createClient();
    const rows = validated.map((p) => ({
      user_id: userId,
      company_name: p.company_name,
      industry: p.industry,
      location: p.location,
      website: p.website,
      instagram: p.instagram,
      fit_reason: p.fit_reason,
      why_now: p.why_now,
      outreach_copy: p.outreach_copy,
      fit_score: p.fit_score,
      follower_range: p.follower_range,
      website_platform: p.website_platform,
      red_flags: p.red_flags,
      icp_query: icpQuery,
      status: "new"
    }));

    const { data, error } = await supabase
      .from("leads")
      .insert(rows)
      .select("*");

    if (error) {
      console.error("[save] insert failed:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        user_id: userId,
        row_count: rows.length,
        first_row_keys: Object.keys(rows[0] ?? {})
      });
      return NextResponse.json(
        {
          error: "internal",
          details: {
            message: error.message,
            code: error.code,
            hint: error.hint
          }
        },
        { status: 500, headers: NO_STORE }
      );
    }

    const leads = (data ?? []) as Lead[];

    if (icpQuery && !profile.saved_icp) {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ saved_icp: icpQuery })
        .eq("id", userId);
      if (profileErr) {
        console.error(
          "[save] could not persist saved_icp (non-fatal):",
          profileErr.message
        );
      }
    }

    return NextResponse.json(
      { saved: leads.length, leads },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error("[save] internal error:", {
      message: err?.message,
      name: err?.name,
      stack: err?.stack?.split("\n").slice(0, 4).join("\n")
    });
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}
