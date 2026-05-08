"use client";

import { CopyButton } from "@/components/lead/CopyButton";

interface Props {
  label: string;
  body: string;
  leadId?: string;
  kind?: "outreach" | "followup";
  meta?: string;
}

export function OutreachBlock({ label, body, meta }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          {label}
        </p>
        {meta && <p className="text-[11px] text-faint">{meta}</p>}
      </div>
      <div className="relative whitespace-pre-wrap rounded-md border border-border border-l-[3px] border-l-[rgba(99,102,241,0.35)] bg-[rgba(0,0,0,0.25)] p-5 pr-16 font-mono text-[13px] leading-[1.8] text-muted">
        {body}
        <CopyButton text={body} />
      </div>
    </section>
  );
}
