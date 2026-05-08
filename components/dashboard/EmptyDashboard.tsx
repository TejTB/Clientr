import Link from "next/link";
import { Search } from "lucide-react";

export function EmptyDashboard() {
  return (
    <div className="relative py-24">
      <div className="watermark">CLIENTR</div>
      <div className="relative mx-auto flex max-w-[340px] flex-col items-center text-center">
        <div className="mb-6 grid h-[72px] w-[72px] place-items-center rounded-full border border-[rgba(99,102,241,0.2)] bg-accent-subtle">
          <Search className="text-accent" size={28} />
        </div>
        <h2 className="mb-2 text-[22px] font-bold text-text">No leads yet.</h2>
        <p className="mb-6 text-[14px] leading-[1.7] text-muted">
          Describe your ideal client and we&apos;ll find real businesses
          matching it, with personalised outreach written for each one.
        </p>
        <Link
          href="/search"
          className="text-[14px] font-semibold text-accent hover:underline"
        >
          Start your first search →
        </Link>
      </div>
    </div>
  );
}
