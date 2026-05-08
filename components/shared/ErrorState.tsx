"use client";

import { Button } from "@/components/ui/Button";

interface Props {
  message: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({ message, retry, className }: Props) {
  return (
    <div
      className={
        "flex items-center justify-between gap-3 rounded-lg border border-[rgba(255,59,59,0.2)] bg-[rgba(255,59,59,0.06)] px-4 py-3 text-[13px] text-danger " +
        (className || "")
      }
      role="alert"
    >
      <span className="leading-relaxed">{message}</span>
      {retry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={retry}
          className="shrink-0"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
