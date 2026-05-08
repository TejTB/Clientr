import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ICPInput } from "@/components/search/ICPInput";
import { getProfile } from "@/lib/profile";
import { FREE_TIER_LIMITS, PRO_TIER_LIMITS } from "@/types/database";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams?: { welcome?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { profile, userId } = await getProfile();
  if (!userId || !profile) {
    redirect("/login");
  }

  const isPro = profile.plan === "pro";
  const limit = isPro ? PRO_TIER_LIMITS.searches : FREE_TIER_LIMITS.searches;
  const used = profile.searches_used ?? 0;
  const searchesRemaining = Math.max(0, limit - used);

  const showWelcome = searchParams?.welcome === "1";

  return (
    <main className="mx-auto max-w-[720px] px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={14} />
        Back to leads
      </Link>

      <div className="mt-10 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
          Find new leads
        </p>
      </div>

      <h1 className="text-[36px] font-extrabold leading-[1.1] tracking-[-0.03em] text-text">
        Find new leads.
      </h1>
      <p className="mt-2 text-[14px] text-muted">
        Describe your ideal client. The more specific, the better the prospects.
      </p>

      {showWelcome && (
        <div className="mt-8 animate-fade-in rounded-md border border-[rgba(99,102,241,0.2)] bg-accent-subtle p-4 text-[13px] text-text">
          Welcome to CLIENTR. Start with your first search below.
        </div>
      )}

      <div className="mt-10">
        <ICPInput
          searchesRemaining={searchesRemaining}
          isPro={isPro}
          initialQuery={profile.saved_icp || ""}
        />
      </div>
    </main>
  );
}
