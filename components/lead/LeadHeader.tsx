import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { StatusPill } from "@/components/ui/StatusPill";
import { FitScore } from "@/components/ui/FitScore";
import { faviconUrl, relativeTime } from "@/lib/utils/cn";
import type { Lead } from "@/types/database";

interface Props {
  lead: Lead;
}

export function LeadHeader({ lead }: Props) {
  const favicon = faviconUrl(lead.website);

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-[1200px] px-6 pb-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-faint transition-colors hover:text-muted"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back to leads
        </Link>

        <div className="mt-5 flex items-start gap-4">
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              width={48}
              height={48}
              className="mt-1 h-10 w-10 rounded-md border border-border bg-surface-2 object-cover"
            />
          ) : (
            <span className="mt-1 grid h-10 w-10 place-items-center rounded-md border border-border bg-surface-2 text-[15px] font-medium text-muted">
              {lead.company_name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-[28px] font-bold leading-tight tracking-tight text-text">
              {lead.company_name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill status={lead.status} />
              {lead.fit_score != null && <FitScore score={lead.fit_score} />}
              {lead.industry && <Pill tone="muted">{lead.industry}</Pill>}
              {lead.location && (
                <span className="text-[12px] text-faint">{lead.location}</span>
              )}
              <span className="text-[12px] text-faint">
                Added {relativeTime(lead.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
