import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { LeadTable } from "@/components/dashboard/LeadTable";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { SavedIcpBar } from "@/components/dashboard/SavedIcpBar";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import type { Lead } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { profile, userId } = await getProfile();
  if (!userId || !profile) {
    redirect("/login");
  }

  const supabase = createClient();
  const { data: leadsData } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const leads: Lead[] = (leadsData as Lead[] | null) ?? [];
  const savedIcp = profile.saved_icp?.trim() ? profile.saved_icp : null;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[36px] font-extrabold leading-[1.1] tracking-[-0.03em] text-text">
            Leads
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            Every prospect, every conversation, in one place.
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-accent-gradient px-5 text-[14px] font-semibold text-white shadow-btn-primary transition-all duration-150 ease-smooth hover:-translate-y-[2px] hover:shadow-btn-primary-hover active:translate-y-0"
        >
          <Plus size={16} /> New search
        </Link>
      </div>

      {savedIcp && <SavedIcpBar icp={savedIcp} />}

      {leads.length > 0 && (
        <div className="mb-8">
          <StatsBar leads={leads} />
        </div>
      )}

      {leads.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <LeadTable leads={leads} />
      )}
    </main>
  );
}
