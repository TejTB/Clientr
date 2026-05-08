import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFollowUp } from "@/lib/anthropic";
import type { Lead } from "@/types/database";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const { data: lead, error: loadErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (loadErr || !lead) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: NO_STORE }
      );
    }

    const typed = lead as Lead;
    const original = (typed.outreach_copy ?? "").trim();
    if (!original) {
      return NextResponse.json(
        { error: "no_outreach_to_follow_up" },
        { status: 400, headers: NO_STORE }
      );
    }

    let followUp: string;
    try {
      followUp = await generateFollowUp(typed.company_name, original);
    } catch (err) {
      console.error("[followup] ai error:", err);
      return NextResponse.json(
        { error: "ai_error" },
        { status: 502, headers: NO_STORE }
      );
    }

    if (!followUp) {
      return NextResponse.json(
        { error: "ai_error" },
        { status: 502, headers: NO_STORE }
      );
    }

    const { error: updErr } = await supabase
      .from("leads")
      .update({ follow_up_copy: followUp })
      .eq("id", typed.id)
      .eq("user_id", user.id);

    if (updErr) {
      console.error("[followup] persist failed:", updErr);
      return NextResponse.json(
        { error: "internal" },
        { status: 500, headers: NO_STORE }
      );
    }

    return NextResponse.json(
      { follow_up_copy: followUp },
      { status: 200, headers: NO_STORE }
    );
  } catch (err) {
    console.error("[followup] internal error:", err);
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}
