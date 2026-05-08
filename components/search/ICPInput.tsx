"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/search/LoadingState";
import { ProspectCard } from "@/components/search/ProspectCard";
import { SelectionBar } from "@/components/search/SelectionBar";
import type { ProspectResult } from "@/types/database";

const PLACEHOLDER =
  "e.g. Independent skincare brands in London with under 20k followers, founder-led, clearly DIY Squarespace site, no clear brand system. I do web design and Meta ads.";

const MAX_CHARS = 500;
const MIN_CHARS = 12;

interface Props {
  searchesRemaining: number;
  isPro: boolean;
  initialQuery?: string;
}

export function ICPInput({ searchesRemaining, isPro, initialQuery = "" }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [value, setValue] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProspectResult[] | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState<string>("");

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const trimmed = value.trim();
  const tooLong = value.length > MAX_CHARS;
  const tooShort = trimmed.length < MIN_CHARS;
  const canSubmit = !tooShort && !tooLong && !loading;

  function toggle(i: number) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    if (!isPro && searchesRemaining <= 0) {
      window.dispatchEvent(new CustomEvent("clientr:upgrade"));
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setSubmittedQuery(trimmed);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icp_query: trimmed })
      });

      if (res.status === 402) {
        window.dispatchEvent(new CustomEvent("clientr:upgrade"));
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error === "limit_reached") {
          window.dispatchEvent(new CustomEvent("clientr:upgrade"));
          return;
        }
        setError(data.error || "Search failed. Try again.");
        return;
      }

      const prospects: ProspectResult[] = data.prospects ?? [];
      if (prospects.length === 0) {
        setError("No prospects found. Try being more specific.");
        return;
      }
      setResults(prospects);
      setSelected(new Set(prospects.map((_, i) => i)));
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!results || selected.size === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const chosen = results.filter((_, i) => selected.has(i));
      const res = await fetch("/api/leads/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospects: chosen, icp_query: submittedQuery })
      });
      if (res.status === 402) {
        window.dispatchEvent(new CustomEvent("clientr:upgrade"));
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "lead_limit" || data.error === "limit_reached") {
          window.dispatchEvent(new CustomEvent("clientr:upgrade"));
          return;
        }
        setSaveError(data.error || "Could not save leads");
        return;
      }
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch {
      setSaveError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  if (results) {
    return (
      <>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-bold leading-tight text-text">
              {results.length} {results.length === 1 ? "prospect" : "prospects"} found
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              Sorted by fit score. Select the ones you want to save.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selected.size === results.length) setSelected(new Set());
              else setSelected(new Set(results.map((_, i) => i)));
            }}
            className="shrink-0 text-[13px] font-semibold text-accent transition-colors hover:underline"
          >
            {selected.size === results.length ? "Deselect all" : "Select all"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {results.map((p, i) => (
            <ProspectCard
              key={`${p.company_name}-${i}`}
              prospect={p}
              selected={selected.has(i)}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        {selected.size > 0 && <div className="h-28" />}

        <SelectionBar
          selectedCount={selected.size}
          onSave={save}
          saving={saving}
          error={saveError}
          onDeselectAll={() => setSelected(new Set())}
        />
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={7}
        maxLength={MAX_CHARS + 200}
        className="min-h-[200px] w-full resize-none rounded-lg border border-border bg-surface p-6 text-[15px] leading-[1.8] text-text outline-none transition-colors placeholder:text-muted focus:border-[rgba(99,102,241,0.5)]"
        autoFocus
      />

      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[12px] italic text-faint">
          <Lightbulb size={12} />
          Tip: include industry, location, size and what makes them a fit.
        </span>
        <span
          className={
            "tabular-nums text-[12px] " +
            (tooLong ? "text-danger-fg" : "text-faint")
          }
        >
          {value.length} / {MAX_CHARS}
        </span>
      </div>

      {error && <p className="mt-3 text-[13px] text-danger-fg">{error}</p>}

      <div className="mt-4 flex items-center justify-end gap-4">
        {!isPro && (
          <span className="text-[13px] text-muted">
            <span className="tabular-nums">{searchesRemaining}</span> searches left
          </span>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!canSubmit}
          loading={loading}
        >
          Find prospects
        </Button>
      </div>
    </form>
  );
}
