import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/types/database";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

const ALLOWED_PATCH_FIELDS = [
  "notes",
  "contact_name",
  "contact_email",
  "follow_up_copy",
  "outreach_copy"
] as const;

type PatchField = (typeof ALLOWED_PATCH_FIELDS)[number];

function nullIfEmpty(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

async function getAuthedClient() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await getAuthedClient();
    if (!user) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE }
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: NO_STORE }
      );
    }

    return NextResponse.json(
      { lead: data as Lead },
      { status: 200, headers: NO_STORE }
    );
  } catch (err) {
    console.error("[lead:get] internal error:", err);
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await getAuthedClient();
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

    const update: Partial<Record<PatchField, string | null>> = {};
    for (const field of ALLOWED_PATCH_FIELDS) {
      if (field in body) {
        const val = body[field];
        if (val === null) {
          update[field] = null;
        } else if (typeof val === "string") {
          update[field] = nullIfEmpty(val);
        } else {
          return NextResponse.json(
            {
              error: "validation_failed",
              details: `${field}_must_be_string_or_null`
            },
            { status: 400, headers: NO_STORE }
          );
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "validation_failed", details: "no_allowed_fields" },
        { status: 400, headers: NO_STORE }
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .update(update)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error("[lead:patch] update failed:", error);
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: NO_STORE }
      );
    }

    return NextResponse.json(
      { lead: data as Lead },
      { status: 200, headers: NO_STORE }
    );
  } catch (err) {
    console.error("[lead:patch] internal error:", err);
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await getAuthedClient();
    if (!user) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE }
      );
    }

    // Defense in depth: explicitly verify ownership before delete,
    // even though RLS + the eq("user_id", user.id) below already enforce it.
    const { data: existing, error: loadErr } = await supabase
      .from("leads")
      .select("id, user_id")
      .eq("id", params.id)
      .single();

    if (loadErr || !existing) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: NO_STORE }
      );
    }

    if ((existing as { user_id: string }).user_id !== user.id) {
      return NextResponse.json(
        { error: "forbidden" },
        { status: 403, headers: NO_STORE }
      );
    }

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[lead:delete] delete failed:", error);
      return NextResponse.json(
        { error: "internal" },
        { status: 500, headers: NO_STORE }
      );
    }

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: NO_STORE }
    );
  } catch (err) {
    console.error("[lead:delete] internal error:", err);
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}
