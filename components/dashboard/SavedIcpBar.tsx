import Link from "next/link";

interface Props {
  icp: string;
}

function truncate(value: string, max = 110) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function SavedIcpBar({ icp }: Props) {
  const display = truncate(icp);
  return (
    <section className="mb-8 flex items-center gap-3 rounded-lg border border-border bg-surface px-5 py-4">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
        Your ICP
      </span>
      <p className="flex-1 truncate text-[13px] text-muted" title={icp}>
        {display}
      </p>
      <Link
        href="/search"
        className="shrink-0 text-[12px] font-semibold text-accent transition-opacity hover:underline"
      >
        Edit
      </Link>
    </section>
  );
}
