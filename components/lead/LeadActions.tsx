"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Lead } from "@/types/database";

export function GenerateFollowUpAction({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/followup`, {
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
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          Follow-up
        </p>
      </div>
      <div className="flex flex-col gap-4 rounded-md border border-dashed border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-text">
            No follow-up yet.
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            Generate one when the first message goes quiet.
          </p>
          {error && (
            <p className="mt-1.5 text-[12px] text-danger-fg">{error}</p>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={generate}
          loading={loading || isPending}
        >
          Generate follow-up
        </Button>
      </div>
    </section>
  );
}

export function QuickActions({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyOutreach() {
    if (!lead.outreach_copy) return;
    try {
      await navigator.clipboard.writeText(lead.outreach_copy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete ${lead.company_name}? This removes the lead and all notes.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not delete lead");
        return;
      }
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={copyOutreach}
        disabled={!lead.outreach_copy}
      >
        {copied ? (
          <>
            <Check size={13} strokeWidth={2.5} /> Copied
          </>
        ) : (
          <>
            <Copy size={13} strokeWidth={2} /> Copy outreach
          </>
        )}
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        loading={deleting}
      >
        <Trash2 size={13} strokeWidth={2} /> Delete lead
      </Button>
      {error && <p className="text-[12px] text-danger-fg">{error}</p>}
    </div>
  );
}

