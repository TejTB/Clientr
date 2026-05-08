"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { StatusPill } from "@/components/ui/StatusPill";
import { FitScore } from "@/components/ui/FitScore";
import { faviconUrl, normalizeUrl, relativeTime } from "@/lib/utils/cn";
import type { Lead } from "@/types/database";

interface Props {
  lead: Lead;
  onOpenSlideOver: (lead: Lead) => void;
}

const COLS =
  "grid-cols-[1.6fr_0.6fr_1fr_0.7fr_0.5fr_0.6fr_0.4fr]";

export function LeadRow({ lead, onOpenSlideOver }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const favicon = faviconUrl(lead.website);
  const site = normalizeUrl(lead.website);
  const websiteLabel = lead.website
    ? lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;
  const initial = lead.company_name.charAt(0).toUpperCase();

  function openSlideOver() {
    onOpenSlideOver(lead);
  }

  async function markAsWon() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "won" })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not update status");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${lead.company_name}? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not delete lead");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  }

  return (
    <>
      {/* Mobile card layout — below md */}
      <div
        onClick={openSlideOver}
        className="mx-4 mb-3 cursor-pointer rounded-md border border-border bg-surface p-4 transition-colors hover:border-[rgba(99,102,241,0.2)] md:hidden"
      >
        {/* Row 1: avatar + name + industry pill | fit score */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={favicon}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-full bg-surface-2 object-cover"
              />
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-subtle text-[12px] font-bold text-accent">
                {initial}
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-[14px] font-semibold text-text">
                {lead.company_name}
              </span>
              {lead.industry && (
                <Pill tone="muted" className="self-start">
                  {lead.industry}
                </Pill>
              )}
            </div>
          </div>
          <FitScore score={lead.fit_score} size="sm" />
        </div>

        {/* Row 2: status pill | View → */}
        <div className="mt-3 flex items-center justify-between">
          <StatusPill status={lead.status} size="sm" />
          <span className="text-[13px] font-semibold text-accent">View →</span>
        </div>
      </div>

      {/* Desktop grid row — md and up */}
      <div
        role="row"
        onClick={openSlideOver}
        className={`group relative hidden h-16 cursor-pointer items-center border-b border-[rgba(255,255,255,0.03)] bg-bg px-5 transition-colors ease-smooth hover:bg-[rgba(99,102,241,0.03)] md:grid row-accent ${COLS}`}
      >
      {/* Company */}
      <div className="flex min-w-0 items-center gap-3 pr-3">
        {favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={favicon}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full bg-surface-2 object-cover"
          />
        ) : (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-subtle text-[12px] font-bold text-accent">
            {initial}
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[14px] font-semibold text-text">
            {lead.company_name}
          </span>
          {websiteLabel && site ? (
            <a
              href={site}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="truncate text-[12px] text-faint transition-colors hover:text-muted"
            >
              {websiteLabel}
            </a>
          ) : null}
        </div>
      </div>

      {/* Score */}
      <div className="pr-3">
        <FitScore score={lead.fit_score} />
      </div>

      {/* Status */}
      <div className="pr-3">
        <StatusPill status={lead.status} />
      </div>

      {/* Industry */}
      <div className="pr-3">
        {lead.industry ? (
          <Pill tone="muted">{lead.industry}</Pill>
        ) : (
          <span className="text-[13px] text-faint">—</span>
        )}
      </div>

      {/* Notes */}
      <div className="min-w-0 pr-3">
        {lead.notes ? (
          <p
            className="truncate text-[12px] text-muted"
            title={lead.notes}
          >
            {lead.notes}
          </p>
        ) : (
          <span className="text-[12px] text-faint">—</span>
        )}
      </div>

      {/* Added */}
      <div className="pr-3 text-[12px] text-muted">
        {relativeTime(lead.created_at)}
      </div>

      {/* Actions */}
      <div
        className="relative flex justify-end"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Lead actions"
          className="grid h-8 w-8 place-items-center rounded-full text-muted opacity-0 transition-all duration-150 ease-smooth hover:bg-surface-2 hover:text-text group-hover:opacity-100 data-[open=true]:opacity-100"
          data-open={menuOpen}
          disabled={busy || isPending}
        >
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-md border border-border bg-surface-2 shadow-dropdown animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onOpenSlideOver(lead);
              }}
              className="flex w-full items-center px-4 py-2 text-left text-[13px] text-muted transition-colors hover:bg-accent-subtle hover:text-text"
            >
              Open in slide-over
            </button>
            <Link
              href={`/lead/${lead.id}`}
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center px-4 py-2 text-left text-[13px] text-muted transition-colors hover:bg-accent-subtle hover:text-text"
            >
              Open detail page
            </Link>
            <button
              type="button"
              onClick={markAsWon}
              disabled={busy || isPending || lead.status === "won"}
              className="flex w-full items-center px-4 py-2 text-left text-[13px] text-muted transition-colors hover:bg-accent-subtle hover:text-text disabled:opacity-40"
            >
              Mark as won
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy || isPending}
              className="flex w-full items-center border-t border-border px-4 py-2 text-left text-[13px] text-danger-fg transition-colors hover:bg-[rgba(239,68,68,0.08)] disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        )}
        {error && (
          <span className="absolute right-0 top-full z-10 mt-10 whitespace-nowrap rounded-md bg-surface-2 px-3 py-1 text-[11px] text-danger-fg shadow-dropdown">
            {error}
          </span>
        )}
      </div>
      </div>
    </>
  );
}
