"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { FitScore } from "@/components/ui/FitScore";
import { Avatar } from "@/components/ui/Avatar";
import { instagramUrl, normalizeUrl } from "@/lib/utils/cn";
import type { ProspectResult } from "@/types/database";

interface Props {
  prospect: ProspectResult;
  selected: boolean;
  onToggle: () => void;
}

function hostOnly(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 text-[11px] text-muted">
      {children}
    </span>
  );
}

function isEmptyRedFlag(s: string | null | undefined): boolean {
  if (!s) return true;
  const t = s.trim().toLowerCase();
  return t === "" || t === "none" || t === "null" || t === "n/a";
}

export function ProspectCard({ prospect, selected, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const site = normalizeUrl(prospect.website);
  const ig = instagramUrl(prospect.instagram);
  const showRedFlag = !isEmptyRedFlag(prospect.red_flags);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!prospect.outreach_copy) return;
    try {
      await navigator.clipboard.writeText(prospect.outreach_copy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <article
      onClick={onToggle}
      className={
        "relative cursor-pointer overflow-hidden rounded-lg border bg-surface p-6 transition-all duration-150 ease-smooth " +
        (selected
          ? "border-accent bg-[rgba(99,102,241,0.04)] shadow-[0_0_0_1px_#6366F1,0_8px_40px_rgba(99,102,241,0.10)]"
          : "border-border hover:-translate-y-[2px] hover:border-[rgba(99,102,241,0.20)] hover:shadow-[0_4px_24px_rgba(99,102,241,0.06)]")
      }
    >
      {selected && (
        <span
          className="absolute left-0 right-0 top-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, #6366F1, transparent)"
          }}
        />
      )}

      {/* HEADER */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={prospect.company_name} website={prospect.website} size={48} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[16px] font-bold leading-tight text-text">
              {prospect.company_name}
            </h3>
            {prospect.industry && (
              <p className="mt-0.5 truncate text-[12px] text-muted">
                {prospect.industry}
              </p>
            )}
            {prospect.location && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-faint">
                <span aria-hidden="true">📍</span>
                {prospect.location}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <FitScore score={prospect.fit_score} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-pressed={selected}
            aria-label={selected ? "Deselect prospect" : "Select prospect"}
            className={
              "grid h-5 w-5 shrink-0 place-items-center rounded-md transition-colors " +
              (selected
                ? "border-accent bg-accent"
                : "border-[1.5px] border-[rgba(255,255,255,0.15)] hover:border-accent")
            }
            style={
              selected
                ? { borderWidth: "1.5px", borderStyle: "solid", borderColor: "#6366F1" }
                : undefined
            }
          >
            {selected && <Check size={14} strokeWidth={3} className="text-white" />}
          </button>
        </div>
      </header>

      {/* META PILLS */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {prospect.website_platform && (
          <MetaPill>
            <span aria-hidden="true">🌐</span>
            <span className="truncate">{prospect.website_platform}</span>
          </MetaPill>
        )}
        {prospect.follower_range && (
          <MetaPill>
            <span aria-hidden="true">👥</span>
            <span className="truncate">{prospect.follower_range} followers</span>
          </MetaPill>
        )}
        {site && (
          <a
            href={site}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 text-[11px] text-muted transition-colors hover:text-accent"
          >
            <span aria-hidden="true">↗</span>
            <span className="max-w-[160px] truncate">{hostOnly(site)}</span>
          </a>
        )}
        {ig && (
          <a
            href={ig}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 text-[11px] text-muted transition-colors hover:text-accent"
          >
            <span aria-hidden="true">@</span>
            <span className="max-w-[120px] truncate">
              {prospect.instagram.replace(/^@/, "")}
            </span>
          </a>
        )}
      </div>

      {/* WHY THEY'RE A FIT */}
      {prospect.fit_reason && (
        <div className="mt-4">
          <p
            className="mb-2 text-[10px] font-semibold uppercase"
            style={{
              letterSpacing: "0.1em",
              color: "rgba(240,240,255,0.25)"
            }}
          >
            Why they&apos;re a fit
          </p>
          <p
            className="rounded-r-[2px] pl-3 text-[13px] leading-[1.7]"
            style={{
              borderLeft: "2px solid rgba(99,102,241,0.3)",
              color: "rgba(240,240,255,0.75)"
            }}
          >
            {prospect.fit_reason}
          </p>
        </div>
      )}

      {/* WHY NOW */}
      {prospect.why_now && prospect.why_now.trim() && (
        <div className="mt-3">
          <p
            className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase text-accent"
            style={{ letterSpacing: "0.1em" }}
          >
            <span aria-hidden="true">⚡</span>
            Why now
          </p>
          <p
            className="text-[13px] italic leading-[1.6]"
            style={{ color: "rgba(240,240,255,0.6)" }}
          >
            {prospect.why_now}
          </p>
        </div>
      )}

      {/* RED FLAGS */}
      {showRedFlag && (
        <div className="mt-2">
          <p
            className="mb-1 text-[10px] font-semibold uppercase"
            style={{ letterSpacing: "0.1em", color: "rgba(245,158,11,0.7)" }}
          >
            <span aria-hidden="true">⚠️</span> Note
          </p>
          <p
            className="text-[12px] leading-[1.5]"
            style={{ color: "rgba(240,240,255,0.4)" }}
          >
            {prospect.red_flags}
          </p>
        </div>
      )}

      {/* OUTREACH ACCORDION */}
      {prospect.outreach_copy && (
        <div
          className="mt-4 pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-accent"
            >
              View outreach
              <ChevronDown
                size={14}
                className={
                  "transition-transform duration-150 ease-smooth " +
                  (open ? "rotate-180" : "rotate-0")
                }
              />
            </button>
            {open && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11px] font-medium transition-colors"
                style={{
                  borderColor: "rgba(99,102,241,0.2)",
                  backgroundColor: copied
                    ? "rgba(99,102,241,0.2)"
                    : "rgba(99,102,241,0.1)",
                  color: "#818CF8"
                }}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            )}
          </div>

          <div
            className="overflow-hidden transition-all duration-300 ease-smooth"
            style={{
              maxHeight: open ? "500px" : "0px",
              opacity: open ? 1 : 0
            }}
          >
            <div
              className="mt-3 whitespace-pre-wrap rounded-md p-4 font-mono"
              style={{
                backgroundColor: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderLeft: "3px solid rgba(99,102,241,0.4)",
                fontSize: "13px",
                lineHeight: "1.9",
                color: "rgba(240,240,255,0.8)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {prospect.outreach_copy}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
