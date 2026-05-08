import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/types/database";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

export async function GET() {
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

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[leads:list] query failed:", error);
      return NextResponse.json(
        { error: "internal" },
        { status: 500, headers: NO_STORE }
      );
    }

    const leads = (data ?? []) as Lead[];
    return NextResponse.json(
      { leads },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error("[leads:list] internal error:", err);
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}
