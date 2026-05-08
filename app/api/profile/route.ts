import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeIcpQuery } from "@/lib/sanitize";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

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

export async function PATCH(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
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

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "validation_failed", details: "body_required" },
        { status: 400, headers: NO_STORE }
      );
    }

    const update: { saved_icp?: string | null; weekly_digest_enabled?: boolean } = {};

    if ("saved_icp" in body) {
      const v = body.saved_icp;
      if (v === null) {
        update.saved_icp = null;
      } else if (typeof v === "string") {
        const cleaned = sanitizeIcpQuery(v);
        update.saved_icp = cleaned.length ? cleaned : null;
      } else {
        return NextResponse.json(
          {
            error: "validation_failed",
            details: "saved_icp_must_be_string_or_null"
          },
          { status: 400, headers: NO_STORE }
        );
      }
    }

    if ("weekly_digest_enabled" in body) {
      const v = body.weekly_digest_enabled;
      if (typeof v !== "boolean") {
        return NextResponse.json(
          {
            error: "validation_failed",
            details: "weekly_digest_enabled_must_be_boolean"
          },
          { status: 400, headers: NO_STORE }
        );
      }
      update.weekly_digest_enabled = v;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "validation_failed", details: "no_allowed_fields" },
        { status: 400, headers: NO_STORE }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error("[profile:patch] update failed:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      return NextResponse.json(
        { error: "internal" },
        { status: 500, headers: NO_STORE }
      );
    }

    const profile = normalize(data);
    if (!profile) {
      return NextResponse.json(
        { error: "internal" },
        { status: 500, headers: NO_STORE }
      );
    }

    return NextResponse.json(
      { profile },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error("[profile:patch] internal error:", {
      message: err?.message,
      name: err?.name
    });
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}
