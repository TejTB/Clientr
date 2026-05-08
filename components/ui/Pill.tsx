import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Pill({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: "neutral" | "muted" | "accent" | "danger" | "warning" | "success";
  className?: string;
}) {
  const tones = {
    neutral: "bg-[rgba(255,255,255,0.08)] text-text",
    muted: "bg-[rgba(255,255,255,0.04)] text-muted",
    accent: "bg-[rgba(99,102,241,0.10)] text-accent border border-[rgba(99,102,241,0.2)]",
    danger:
      "bg-[rgba(239,68,68,0.10)] text-danger-fg border border-[rgba(239,68,68,0.2)]",
    warning:
      "bg-[rgba(245,158,11,0.10)] text-warning-fg border border-[rgba(245,158,11,0.2)]",
    success:
      "bg-[rgba(16,185,129,0.10)] text-success-fg border border-[rgba(16,185,129,0.2)]"
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium leading-none",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
