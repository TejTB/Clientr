import { redirect } from "next/navigation";
import { Layout } from "@/components/shared/Layout";
import { getProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function DashboardGroupLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile, userId } = await getProfile();
  if (!userId || !profile) {
    redirect("/login");
  }
  return <Layout profile={profile}>{children}</Layout>;
}
