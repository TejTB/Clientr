"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { FitScore } from "@/components/ui/FitScore";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { faviconUrl } from "@/lib/utils/cn";
import type { Lead } from "@/types/database";

interface Props {
  lead: Lead | null;
  onClose: () => void;
}

export function SlideOver({ lead, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [marking, setMarking] = useState(false);

  // Reset state when a different lead opens. Keyed on identity, not content.
  useEffect(() => {
    setFollowUp(lead?.follow_up_copy ?? null);
    setError(null);
    setMarking(false);
    setGenerating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id]);

  useEffect(() => {
    if (!lead) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, onClose]);

  if (!lead) return null;

  const outreach = lead.outreach_copy ?? "";
  const favicon = faviconUrl(lead.website);
  const initial = lead.company_name.charAt(0).toUpperCase();
  const sentStatuses = new Set([
    "outreach_sent",
    "followed_up",
    "replied",
    "won"
  ]);
  const alreadySent = sentStatuses.has(lead.status);

  async function markAsSent() {
    if (!lead) return;
    setMarking(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "outreach_sent" })
      });
      if (res.status === 402) {
        window.dispatchEvent(new CustomEvent("clientr:upgrade"));
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not mark as sent");
        return;
      }
      startTransition(() => router.refresh());
      setTimeout(() => onClose(), 600);
    } finally {
      setMarking(false);
    }
  }

  async function generateFollowUp() {
    if (!lead) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/followup`, {
        method: "POST"
      });
      if (res.status === 402) {
        window.dispatchEvent(new CustomEvent("clientr:upgrade"));
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not generate follow-up");
        return;
      }
      const data = await res.json();
      setFollowUp(data.follow_up_copy ?? null);
      startTransition(() => router.refresh());
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label={`Outreach for ${lead.company_name}`}
        className="fixed bottom-0 right-0 top-0 z-50 flex w-[480px] max-w-full flex-col overflow-y-auto border-l border-border bg-surface shadow-panel animate-slide-in-right"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            {favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={favicon}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-full bg-surface-2 object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-subtle text-[13px] font-bold text-accent">
                {initial}
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1.5">
              <h2 className="truncate text-[18px] font-semibold leading-tight text-text">
                {lead.company_name}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={lead.status} size="sm" />
                {lead.fit_score != null && (
                  <FitScore score={lead.fit_score} size="sm" />
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 px-6 py-6">
          <div className="mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
              Outreach
            </span>
          </div>
          <div className="relative">
            {outreach && (
              <div className="absolute right-3 top-3">
                <CopyButton text={outreach} />
              </div>
            )}
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-4 pr-24 font-mono text-[13px] leading-[1.8] text-muted">
{outreach || "No outreach copy yet."}
            </pre>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="primary"
              size="md"
              onClick={markAsSent}
              loading={marking || isPending}
              disabled={alreadySent}
              className="w-full sm:w-auto"
            >
              {alreadySent ? "Already sent" : "Mark as sent"}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={generateFollowUp}
              loading={generating}
              className="w-full sm:w-auto"
            >
              Generate follow-up
            </Button>
          </div>

          {followUp && (
            <div className="mt-8">
              <div className="mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
                  Follow-up
                </span>
              </div>
              <div className="relative">
                <div className="absolute right-3 top-3">
                  <CopyButton text={followUp} />
                </div>
                <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-4 pr-24 font-mono text-[13px] leading-[1.8] text-muted">
{followUp}
                </pre>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-[13px] text-danger-fg">{error}</p>
          )}
        </div>
      </aside>
    </>
  );
}
