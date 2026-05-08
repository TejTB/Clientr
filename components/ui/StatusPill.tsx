import type { LeadStatus } from "@/types/database";
import { STATUS_LABELS } from "@/types/database";

const tones: Record<
  LeadStatus,
  { bg: string; color: string; border: string; weight?: string }
> = {
  new: {
    bg: "rgba(255,255,255,0.04)",
    color: "rgba(240,240,255,0.4)",
    border: "rgba(255,255,255,0.08)"
  },
  outreach_sent: {
    bg: "rgba(99,102,241,0.10)",
    color: "#818CF8",
    border: "rgba(99,102,241,0.20)"
  },
  followed_up: {
    bg: "rgba(245,158,11,0.10)",
    color: "#FCD34D",
    border: "rgba(245,158,11,0.20)"
  },
  replied: {
    bg: "rgba(16,185,129,0.10)",
    color: "#34D399",
    border: "rgba(16,185,129,0.20)"
  },
  won: {
    bg: "rgba(16,185,129,0.15)",
    color: "#10B981",
    border: "rgba(16,185,129,0.30)",
    weight: "700"
  },
  lost: {
    bg: "rgba(239,68,68,0.08)",
    color: "#F87171",
    border: "rgba(239,68,68,0.15)"
  }
};

export function StatusPill({
  status,
  size = "md"
}: {
  status: LeadStatus;
  size?: "sm" | "md";
}) {
  const t = tones[status];
  return (
    <span
      className="inline-flex items-center rounded-full border leading-none"
      style={{
        backgroundColor: t.bg,
        color: t.color,
        borderColor: t.border,
        fontWeight: t.weight ?? 600,
        padding: size === "sm" ? "2px 8px" : "3px 10px",
        fontSize: size === "sm" ? "10px" : "11px",
        letterSpacing: "0.01em"
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
