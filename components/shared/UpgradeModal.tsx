"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const PERKS = [
  "Unlimited searches per month",
  "Unlimited leads in your dashboard",
  "AI-generated follow-ups on every lead",
  "Weekly prospect digest emails"
];

export function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  useEffect(() => {
    function onUpgrade() {
      setOpen(true);
    }
    window.addEventListener("clientr:upgrade", onUpgrade as EventListener);
    return () =>
      window.removeEventListener("clientr:upgrade", onUpgrade as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      setIsPro(data?.plan === "pro");
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  async function handleCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(
          data.error === "already_pro"
            ? "You are already on Pro."
            : "Could not start checkout. Try again."
        );
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not start checkout. Try again.");
      setSubmitting(false);
    }
  }

  async function handlePortal() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "content-type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError("Could not open billing. Try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not open billing. Try again.");
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="relative w-full max-w-[440px] animate-slide-up rounded-xl border border-border-strong bg-surface p-8 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          Upgrade
        </div>
        <h2
          id="upgrade-modal-title"
          className="mt-2 text-[24px] font-bold leading-tight text-text"
        >
          {isPro ? "You are on Pro." : "Unlock unlimited search."}
        </h2>

        <ul className="mt-6 space-y-3">
          {PERKS.map((perk) => (
            <li
              key={perk}
              className="flex items-start gap-3 text-[14px] leading-relaxed text-text"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-subtle">
                <Check size={12} strokeWidth={2.5} className="text-accent" />
              </span>
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex items-baseline gap-1.5">
          <span className="text-[36px] font-extrabold leading-none text-text">
            £29.99
          </span>
          <span className="text-[14px] text-muted">/ month</span>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-3.5 py-2.5 text-[13px] text-danger-fg">
            {error}
          </div>
        )}

        <div className="mt-6">
          {isPro ? (
            <Button
              onClick={handlePortal}
              loading={submitting}
              className="w-full"
            >
              Manage billing
            </Button>
          ) : (
            <Button
              onClick={handleCheckout}
              loading={submitting}
              className="w-full"
            >
              Upgrade to Pro →
            </Button>
          )}
        </div>

        <p className="mt-3 text-center text-[12px] text-faint">
          Cancel anytime. No setup fees.
        </p>
      </div>
    </div>
  );
}
