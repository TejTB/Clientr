import { notFound, redirect } from "next/navigation";
import { ExternalLink, Instagram, Mail, User } from "lucide-react";
import { LeadHeader } from "@/components/lead/LeadHeader";
import { OutreachBlock } from "@/components/lead/OutreachBlock";
import { StatusSelector } from "@/components/lead/StatusSelector";
import { NotesTimeline } from "@/components/lead/NotesTimeline";
import { GenerateFollowUpAction, QuickActions } from "@/components/lead/LeadActions";
import { Pill } from "@/components/ui/Pill";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { instagramUrl, normalizeUrl, relativeTime } from "@/lib/utils/cn";
import type { Lead } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params
}: {
  params: { id: string };
}) {
  const { profile, userId } = await getProfile();
  if (!userId || !profile) {
    redirect("/login");
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  const lead = (data as Lead | null) ?? null;
  if (!lead) {
    notFound();
  }

  const site = normalizeUrl(lead.website);
  const ig = instagramUrl(lead.instagram);
  const hasContact =
    Boolean(site) ||
    Boolean(ig) ||
    Boolean(lead.contact_name) ||
    Boolean(lead.contact_email);

  return (
    <>
      <LeadHeader lead={lead} />

      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-8">
            {lead.outreach_copy && (
              <OutreachBlock
                label="Outreach"
                body={lead.outreach_copy}
                leadId={lead.id}
                kind="outreach"
              />
            )}

            {lead.follow_up_copy ? (
              <OutreachBlock
                label="Follow-up"
                body={lead.follow_up_copy}
                leadId={lead.id}
                kind="followup"
                meta={`Generated ${relativeTime(lead.updated_at)}`}
              />
            ) : (
              <GenerateFollowUpAction leadId={lead.id} />
            )}

            <NotesTimeline leadId={lead.id} />
          </div>

          <aside className="flex flex-col gap-8">
            <section>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                Company
              </p>
              <dl className="flex flex-col gap-3 text-[13px]">
                {site && (
                  <a
                    href={site}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-muted transition-colors hover:text-text"
                  >
                    <ExternalLink size={13} strokeWidth={2} className="shrink-0" />
                    <span className="truncate">
                      {site.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                )}
                {ig && (
                  <a
                    href={ig}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-muted transition-colors hover:text-text"
                  >
                    <Instagram size={13} strokeWidth={2} className="shrink-0" />
                    <span className="truncate">
                      {(lead.instagram ?? "").replace(/^@/, "")}
                    </span>
                  </a>
                )}
                {lead.contact_name && (
                  <div className="inline-flex items-center gap-2 text-muted">
                    <User size={13} strokeWidth={2} className="shrink-0" />
                    <span className="text-text">{lead.contact_name}</span>
                  </div>
                )}
                {lead.contact_email && (
                  <a
                    href={`mailto:${lead.contact_email}`}
                    className="inline-flex items-center gap-2 text-muted transition-colors hover:text-text"
                  >
                    <Mail size={13} strokeWidth={2} className="shrink-0" />
                    <span className="truncate">{lead.contact_email}</span>
                  </a>
                )}
                {!hasContact && (
                  <span className="text-faint">No contact details yet.</span>
                )}
              </dl>
            </section>

            {lead.fit_reason && (
              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                  Why they&apos;re a fit
                </p>
                <p className="border-l-[3px] border-[rgba(99,102,241,0.3)] pl-3 text-[13px] leading-[1.7] text-muted">
                  {lead.fit_reason}
                </p>
              </section>
            )}

            {(lead.follower_range || lead.website_platform) && (
              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                  Signals
                </p>
                <div className="flex flex-wrap gap-2">
                  {lead.website_platform && (
                    <Pill tone="muted">{lead.website_platform}</Pill>
                  )}
                  {lead.follower_range && (
                    <Pill tone="muted">{lead.follower_range} followers</Pill>
                  )}
                </div>
              </section>
            )}

            <StatusSelector lead={lead} />

            <section>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                Quick actions
              </p>
              <QuickActions lead={lead} />
            </section>

            {lead.icp_query && (
              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                  Found via search
                </p>
                <p className="rounded-md border border-border bg-surface p-3 text-[12px] leading-[1.7] text-muted">
                  {lead.icp_query}
                </p>
              </section>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
