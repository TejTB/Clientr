import type { ReactNode } from "react";
import { Navbar } from "@/components/shared/Navbar";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import type { Profile } from "@/types/database";

interface Props {
  profile: Profile | null;
  children: ReactNode;
}

export function Layout({ profile, children }: Props) {
  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      {children}
      <UpgradeModal />
    </div>
  );
}
