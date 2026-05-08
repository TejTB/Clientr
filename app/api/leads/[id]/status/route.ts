import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

export async function PATCH(
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

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "validation_failed", details: "invalid_json" },
        { status: 400, headers: NO_STORE }
      );
    }

    const status = body?.status;
    if (
      typeof status !== "string" ||
      !LEAD_STATUSES.includes(status as LeadStatus)
    ) {
      return NextResponse.json(
        { error: "validation_failed", details: "invalid_status" },
        { status: 400, headers: NO_STORE }
      );
    }

    const { data, error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error("[lead:status] update failed:", error);
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
    console.error("[lead:status] internal error:", err);
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}
