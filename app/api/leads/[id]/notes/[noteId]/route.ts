import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; noteId: string } }
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

    // Defense in depth: explicitly verify note ownership before delete,
    // even though RLS + the eq("user_id", user.id) below already enforce it.
    const { data: existing, error: loadErr } = await supabase
      .from("lead_notes")
      .select("id, user_id, lead_id")
      .eq("id", params.noteId)
      .single();

    if (loadErr || !existing) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: NO_STORE }
      );
    }

    const typed = existing as { user_id: string; lead_id: string };
    if (typed.user_id !== user.id || typed.lead_id !== params.id) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: NO_STORE }
      );
    }

    const { error } = await supabase
      .from("lead_notes")
      .delete()
      .eq("id", params.noteId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[notes:delete] delete failed:", {
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
      { ok: true },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error("[notes:delete] internal error:", {
      message: err?.message,
      name: err?.name
    });
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}
