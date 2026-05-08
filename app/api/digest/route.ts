import { NextResponse } from "next/server";
import { getProfile } from "@/lib/profile";
import { searchProspects, describeAnthropicError } from "@/lib/anthropic";
import { getAppUrl } from "@/lib/env";
import { renderDigestHtml, DIGEST_SUBJECT } from "@/lib/digest-template";
import type { ProspectResult } from "@/types/database";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const NO_STORE = { "cache-control": "no-store" } as const;

export async function POST(req: Request) {
  try {
    const { profile, userId } = await getProfile();
    if (!profile || !userId) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: NO_STORE }
      );
    }

    const icp = (profile.saved_icp ?? "").trim();
    if (!icp) {
      return NextResponse.json(
        { error: "validation_failed", details: "saved_icp_required" },
        { status: 400, headers: NO_STORE }
      );
    }

    let prospects: ProspectResult[];
    try {
      prospects = await searchProspects(icp);
    } catch (err: any) {
      if (err?.code === "parse_failed") {
        console.error("[digest] parse failed", {
          raw_preview:
            typeof err?.raw === "string" ? err.raw.slice(0, 300) : null
        });
        return NextResponse.json(
          { error: "parse_failed" },
          { status: 502, headers: NO_STORE }
        );
      }
      console.error("[digest] ai error:", describeAnthropicError(err));
      return NextResponse.json(
        { error: "ai_error" },
        { status: 502, headers: NO_STORE }
      );
    }

    const appUrl = getAppUrl();
    const html = renderDigestHtml({ prospects, icp, appUrl });
    const subject = DIGEST_SUBJECT;

    // TODO: when Resend / SendGrid is configured, wire actual delivery here:
    //   await resend.emails.send({
    //     from: "CLIENTR <digest@clientr.app>",
    //     to: profile.email!,
    //     subject,
    //     html
    //   });

    return NextResponse.json(
      { icp, prospects, html, subject },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error("[digest] internal error:", {
      message: err?.message,
      name: err?.name
    });
    return NextResponse.json(
      { error: "internal" },
      { status: 500, headers: NO_STORE }
    );
  }
}
