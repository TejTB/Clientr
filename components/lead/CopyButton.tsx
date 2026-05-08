"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy"}
      className={cn(
        "absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-muted transition-all duration-150 ease-smooth hover:border-border-strong hover:text-text",
        className
      )}
    >
      {copied ? (
        <>
          <Check size={12} strokeWidth={2.5} className="text-accent" />
          Copied
        </>
      ) : (
        <>
          <Copy size={12} strokeWidth={2} />
          Copy
        </>
      )}
    </button>
  );
}
