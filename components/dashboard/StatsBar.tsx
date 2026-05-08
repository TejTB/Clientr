import { Check, MessageSquare, Send, Users, type LucideIcon } from "lucide-react";
import type { Lead } from "@/types/database";

interface CardProps {
  label: string;
  value: number;
  Icon: LucideIcon;
}

function Card({ label, value, Icon }: CardProps) {
  return (
    <div className="gradient-line-top relative overflow-hidden rounded-lg border border-border bg-surface p-5 transition-all duration-150 ease-smooth hover:-translate-y-[2px] hover:border-[rgba(99,102,241,0.2)]">
      <Icon size={20} className="absolute right-5 top-5 text-accent" />
      <div className="text-[32px] font-extrabold leading-none tracking-[-0.02em] tabular-nums text-text">
        {value}
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </div>
    </div>
  );
}

export function StatsBar({ leads }: { leads: Lead[] }) {
  const total = leads.length;
  const outreachSent = leads.filter(
    (l) =>
      l.status === "outreach_sent" ||
      l.status === "followed_up" ||
      l.status === "replied" ||
      l.status === "won"
  ).length;
  const replied = leads.filter(
    (l) => l.status === "replied" || l.status === "won"
  ).length;
  const won = leads.filter((l) => l.status === "won").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Total Leads" value={total} Icon={Users} />
      <Card label="Outreach Sent" value={outreachSent} Icon={Send} />
      <Card label="Replied" value={replied} Icon={MessageSquare} />
      <Card label="Won" value={won} Icon={Check} />
    </div>
  );
}
