"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  selectedCount: number;
  onSave: () => void;
  saving: boolean;
  error: string | null;
  onDeselectAll?: () => void;
}

export function SelectionBar({
  selectedCount,
  onSave,
  saving,
  error,
  onDeselectAll
}: Props) {
  if (selectedCount === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 animate-slide-up">
      <div className="flex items-center gap-4 rounded-lg border border-[rgba(99,102,241,0.25)] bg-[rgba(15,15,26,0.92)] px-5 py-3.5 shadow-accent-lg backdrop-blur-xl">
        <p className="text-[14px] font-semibold text-text">
          <span className="tabular-nums">{selectedCount}</span>{" "}
          {selectedCount === 1 ? "prospect" : "prospects"} selected
        </p>
        {onDeselectAll && (
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-[13px] text-muted transition-colors hover:text-text"
          >
            Deselect all
          </button>
        )}
        <Button variant="primary" size="md" onClick={onSave} loading={saving}>
          Save to CLIENTR
          <ArrowRight size={14} />
        </Button>
        {error && (
          <p className="text-[12px] text-danger-fg" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
