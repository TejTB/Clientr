import { NextResponse } from "next/server";
import { getProfile } from "@/lib/profile";
import { checkSearchLimit } from "@/lib/rate-limit";
import { searchProspects, describeAnthropicError } from "@/lib/anthropic";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeIcpQuery } from "@/lib/sanitize";
import { applyQualityGate } from "@/lib/quality-gate";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const NO_STORE = { "cache-control": "no-store" } as const;

export async function POST(req: Request) {
  try {
    // Auth is the gate. Supabase session cookies are SameSite=Lax by default,
    // so the browser already prevents cross-site POSTs from including them,
    // which gives us CSRF protection at the cookie layer. No same-origin check
    // is needed here.
    const { profile, userId } = await getProfile();
    if (!profile || !userId) {
      // Log enough to distinguish "no cookie" from "stale cookie" from
      // "supabase down". Sensitive values are never logged.
      const cookieHeader = req.headers.get("cookie") ?? "";
      const supabaseCookieNames = cookieHeader
        .split(/;\s*/)
        .map((c) => c.split("=")[0])
        .filter((n) => n.startsWith("sb-"));
      console.error("[search] 401 unauthorized — no Supabase session:", {
        has_profile: Boolean(profile),
        has_user_id: Boolean(userId),
        sb_cookies_present: supabaseCookieNames,
        supabase_url_configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        anon_key_configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        url: req.url
      });
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

    const icpQuery = sanitizeIcpQuery(body?.icp_query);
    if (!icpQuery) {
      return NextResponse.json(
        { error: "validation_failed", details: "icp_query_required" },
        { status: 400, headers: NO_STORE }
      );
    }
    if (icpQuery.length < 12) {
      return NextResponse.json(
        { error: "validation_failed", details: "icp_query_too_short" },
        { status: 400, headers: NO_STORE }
      );
    }

    const limit = await checkSearchLimit(profile);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "limit_reached", limit_type: "searches", plan: profile.plan },
        { status: 402, headers: NO_STORE }
      );
    }

    let prospects;
    try {
      prospects = await searchProspects(icpQuery);
    } catch (err: any) {
      if (err?.code === "parse_failed") {
        const raw = typeof err?.raw === "string" ? err.raw : "";
        console.error("[search] parse_failed. Full raw response:");
        console.error(raw.slice(0, 6000));
        if (raw.length > 6000) {
          console.error(`[search] (raw truncated at 6000 chars; total ${raw.length})`);
        }
        return NextResponse.json(
          { error: "parse_failed" },
          { status: 502, headers: NO_STORE }
        );
      }

      const detail = describeAnthropicError(err);
      console.error("[search] ai error:", detail);
      console.error("[search] env check:", {
        anthropic_key_present: Boolean(process.env.ANTHROPIC_API_KEY),
        anthropic_key_prefix:
          process.env.ANTHROPIC_API_KEY?.slice(0, 7) ?? null
      });

      return NextResponse.json(
        { error: "ai_error" },
        { status: 502, headers: NO_STORE }
      );
    }

    // Quality gate: drop fit_score < 6 / empty names, fill template outreach,
    // sort by fit_score desc. Best prospects always surface first.
    const cleaned = applyQualityGate(prospects);
    if (cleaned.length === 0) {
      console.error("[search] all prospects dropped by quality gate", {
        raw_count: prospects.length
      });
      return NextResponse.json(
        { error: "no_prospects_passed_quality_gate" },
        { status: 502, headers: NO_STORE }
      );
    }

    const admin = createAdminClient();
    const nextUsed = (profile.searches_used ?? 0) + 1;
    const { error: updErr } = await admin
      .from("profiles")
      .update({ searches_used: nextUsed })
      .eq("id", userId);
    if (updErr) {
      console.error("[search] failed to increment counter");
    }

    const remaining = Math.max(limit.remaining - 1, 0);

    return NextResponse.json(
      { prospects: cleaned, icp_query: icpQuery, searches_remaining: remaining },
      { status: 200, headers: NO_STORE }
    );
  } catch (err) {
    console.error("[search] internal error");
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}
