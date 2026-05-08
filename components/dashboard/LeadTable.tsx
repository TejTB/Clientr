"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { LeadRow } from "@/components/dashboard/LeadRow";
import { SlideOver } from "@/components/dashboard/SlideOver";
import type { Lead, LeadStatus } from "@/types/database";
import { LEAD_STATUSES, STATUS_LABELS } from "@/types/database";

interface Props {
  leads: Lead[];
}

const FILTERS: Array<{ key: "all" | LeadStatus; label: string }> = [
  { key: "all", label: "All" },
  ...LEAD_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] }))
];

const COLS = "grid-cols-[1.6fr_0.6fr_1fr_0.7fr_0.5fr_0.6fr_0.4fr]";

const HEADERS = [
  "Company",
  "Score",
  "Status",
  "Industry",
  "Notes",
  "Added",
  ""
];

export function LeadTable({ leads }: Props) {
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [query, setQuery] = useState("");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Re-derive active lead from props when leads update (after refresh).
  const liveActive = useMemo(() => {
    if (!activeLead) return null;
    return leads.find((l) => l.id === activeLead.id) ?? null;
  }, [activeLead, leads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter !== "all" && l.status !== filter) return false;
      if (!q) return true;
      const hay = [l.company_name, l.industry, l.location, l.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leads, filter, query]);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? leads.length
                : leads.filter((l) => l.status === f.key).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={
                  "shrink-0 rounded-full px-3 py-1.5 text-[12px] transition-colors duration-150 ease-smooth " +
                  (active
                    ? "bg-surface-2 text-text"
                    : "text-muted hover:bg-surface hover:text-text")
                }
              >
                {f.label}
                <span className="ml-1.5 text-faint tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads"
            className="pl-9"
          />
        </div>
      </div>

      <div className="md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-surface">
        {/* Header — desktop only */}
        <div
          className={`hidden h-11 items-center bg-surface-2 px-5 md:grid ${COLS}`}
          role="row"
        >
          {HEADERS.map((h, i) => (
            <div
              key={i}
              className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint"
            >
              {h}
            </div>
          ))}
        </div>

        {/* Body */}
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-[13px] text-muted">
            No leads match.
          </div>
        ) : (
          filtered.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onOpenSlideOver={setActiveLead}
            />
          ))
        )}
      </div>

      <SlideOver lead={liveActive} onClose={() => setActiveLead(null)} />
    </>
  );
}
