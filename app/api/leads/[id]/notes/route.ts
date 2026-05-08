import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LeadNote } from "@/types/database";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;
const NOTE_MAX_CHARS = 2000;

async function getAuthedClient() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function verifyLeadOwnership(
  supabase: ReturnType<typeof createClient>,
  leadId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, user_id")
    .eq("id", leadId)
    .single();
  if (error || !data) return false;
  return (data as { user_id: string }).user_id === userId;
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

    const owns = await verifyLeadOwnership(supabase, params.id, user.id);
    if (!owns) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: NO_STORE }
      );
    }

    const { data, error } = await supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", params.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[notes:get] load failed:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: "internal" },
        { status: 500, headers: NO_STORE }
      );
    }

    return NextResponse.json(
      { notes: (data ?? []) as LeadNote[] },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error("[notes:get] internal error:", {
      message: err?.message,
      name: err?.name
    });
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function POST(
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

    const rawContent = body?.content;
    if (typeof rawContent !== "string") {
      return NextResponse.json(
        { error: "validation_failed", details: "content_must_be_string" },
        { status: 400, headers: NO_STORE }
      );
    }
    const content = rawContent.trim();
    if (!content) {
      return NextResponse.json(
        { error: "validation_failed", details: "content_required" },
        { status: 400, headers: NO_STORE }
      );
    }
    if (content.length > NOTE_MAX_CHARS) {
      return NextResponse.json(
        { error: "validation_failed", details: "content_too_long" },
        { status: 400, headers: NO_STORE }
      );
    }

    const owns = await verifyLeadOwnership(supabase, params.id, user.id);
    if (!owns) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: NO_STORE }
      );
    }

    const { data, error } = await supabase
      .from("lead_notes")
      .insert({
        lead_id: params.id,
        user_id: user.id,
        content
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("[notes:post] insert failed:", {
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

    return NextResponse.json(
      { note: data as LeadNote },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error("[notes:post] internal error:", {
      message: err?.message,
      name: err?.name
    });
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}
