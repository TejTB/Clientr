"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/ui/Wordmark";
import { Pill } from "@/components/ui/Pill";
import type { Profile } from "@/types/database";
import { FREE_TIER_LIMITS } from "@/types/database";
import { cn } from "@/lib/utils/cn";

interface Props {
  profile: Profile | null;
  showUpgrade?: boolean;
}

export function Navbar({ profile, showUpgrade = true }: Props) {
  const isPro = profile?.plan === "pro";
  const searchesUsed = profile?.searches_used ?? 0;
  const searchesRemaining = profile
    ? Math.max(0, FREE_TIER_LIMITS.searches - searchesUsed)
    : null;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleUpgrade() {
    window.dispatchEvent(new CustomEvent("clientr:upgrade"));
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border backdrop-blur-xl transition-all duration-200 ease-smooth",
        scrolled
          ? "bg-[rgba(8,8,15,0.95)] shadow-[0_1px_0_rgba(255,255,255,0.04)]"
          : "bg-[rgba(8,8,15,0.85)]"
      )}
    >
      <div className="mx-auto flex h-[56px] max-w-[1280px] items-center justify-between px-6">
        <div className="flex items-center">
          <Wordmark size="sm" />
          <nav className="ml-6 hidden items-center gap-1 sm:flex">
            <Link
              href="/"
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-text"
            >
              Leads
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {profile && !isPro && searchesRemaining !== null && (
            <span className="inline-flex items-center rounded-full border border-[rgba(99,102,241,0.2)] bg-accent-subtle px-3 py-1 text-[12px] text-text">
              <span className="tabular-nums">{searchesRemaining}</span>
              <span className="mx-0.5 text-muted">/</span>
              <span className="tabular-nums text-muted">
                {FREE_TIER_LIMITS.searches}
              </span>
              <span className="ml-1 text-muted">searches</span>
            </span>
          )}
          {profile && isPro && <Pill tone="accent">Pro</Pill>}
          {showUpgrade && profile && !isPro && (
            <button
              onClick={handleUpgrade}
              className="rounded-full bg-accent-gradient px-4 py-1.5 text-[12px] font-semibold text-white shadow-accent transition-all duration-150 ease-smooth hover:-translate-y-[1px] hover:shadow-btn-primary-hover"
            >
              Upgrade
            </button>
          )}
          <form action="/logout" method="POST">
            <button
              type="submit"
              className="text-[12px] text-faint transition-colors hover:text-muted"
              aria-label="Sign out"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
