"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface Props {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
      className={`absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-3 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-accent-subtle hover:text-accent ${className}`}
    >
      {copied ? (
        <>
          <Check size={12} /> Copied
        </>
      ) : (
        <>
          <Copy size={12} /> Copy
        </>
      )}
    </button>
  );
}
