"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadStatus } from "@/types/database";
import { LEAD_STATUSES, STATUS_LABELS } from "@/types/database";

const ACTIVE_TONES: Record<
  LeadStatus,
  { bg: string; color: string; border: string; weight: number }
> = {
  new: {
    bg: "rgba(255,255,255,0.08)",
    color: "rgba(240,240,255,0.85)",
    border: "rgba(255,255,255,0.12)",
    weight: 600
  },
  outreach_sent: {
    bg: "rgba(99,102,241,0.10)",
    color: "#818CF8",
    border: "rgba(99,102,241,0.20)",
    weight: 600
  },
  followed_up: {
    bg: "rgba(245,158,11,0.10)",
    color: "#FCD34D",
    border: "rgba(245,158,11,0.20)",
    weight: 600
  },
  replied: {
    bg: "rgba(16,185,129,0.10)",
    color: "#34D399",
    border: "rgba(16,185,129,0.20)",
    weight: 600
  },
  won: {
    bg: "rgba(16,185,129,0.15)",
    color: "#10B981",
    border: "rgba(16,185,129,0.30)",
    weight: 700
  },
  lost: {
    bg: "rgba(239,68,68,0.08)",
    color: "#F87171",
    border: "rgba(239,68,68,0.15)",
    weight: 600
  }
};

interface Props {
  lead: Lead;
}

export function StatusSelector({ lead }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [updating, setUpdating] = useState<LeadStatus | null>(null);
  const [current, setCurrent] = useState<LeadStatus>(lead.status);
  const [error, setError] = useState<string | null>(null);

  async function update(next: LeadStatus) {
    if (next === current || updating) return;
    setUpdating(next);
    setError(null);
    const previous = current;
    setCurrent(next);
    try {
      const res = await fetch(`/api/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      if (!res.ok) {
        setCurrent(previous);
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not update status");
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setCurrent(previous);
      setError("Network error. Try again.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <section>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
        Status
      </p>
      <div className="flex flex-wrap gap-2">
        {LEAD_STATUSES.map((s) => {
          const active = current === s;
          const tone = ACTIVE_TONES[s];
          return (
            <button
              key={s}
              onClick={() => update(s)}
              disabled={updating !== null || s === current}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 ease-smooth ${
                active
                  ? ""
                  : "border-border bg-surface text-faint hover:border-border-strong hover:text-muted"
              } disabled:cursor-default`}
              style={
                active
                  ? {
                      backgroundColor: tone.bg,
                      color: tone.color,
                      borderColor: tone.border,
                      fontWeight: tone.weight
                    }
                  : undefined
              }
            >
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-[12px] text-danger-fg">{error}</p>}
    </section>
  );
}
