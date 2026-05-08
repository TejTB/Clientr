"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/ui/Wordmark";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: { email?: string; password?: string; confirm?: string } = {};
    if (!email.trim()) errs.email = "Enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "That email looks off.";
    if (!password) errs.password = "Enter a password.";
    else if (password.length < 8) errs.password = "Use at least 8 characters.";
    if (!confirm) errs.confirm = "Confirm your password.";
    else if (confirm !== password) errs.confirm = "Passwords do not match.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/search?welcome=1`
      }
    });
    setLoading(false);

    if (error) {
      setFormError(error.message || "We could not create your account.");
      return;
    }

    if (data.user) {
      router.push("/search?welcome=1");
      router.refresh();
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_70%)] blur-2xl"
      />
      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
        <div className="mb-8">
          <Wordmark size="md" />
        </div>

        <div className="w-full max-w-[400px] rounded-xl border border-border bg-surface p-10">
          <h1 className="text-[24px] font-bold leading-tight text-text">
            Create your account
          </h1>
          <p className="mb-8 mt-1 text-[14px] text-muted">
            Three free searches to start. No card required.
          </p>

          <form onSubmit={onSubmit} noValidate>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-faint"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className="w-full rounded-md border border-border bg-[rgba(0,0,0,0.3)] px-4 py-3 text-[14px] text-text placeholder:text-faint outline-none transition-colors"
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-[12px] text-danger-fg">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-faint"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-md border border-border bg-[rgba(0,0,0,0.3)] px-4 py-3 text-[14px] text-text placeholder:text-faint outline-none transition-colors"
              />
              {fieldErrors.password && (
                <p className="mt-1.5 text-[12px] text-danger-fg">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="mb-2">
              <label
                htmlFor="confirm"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-faint"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full rounded-md border border-border bg-[rgba(0,0,0,0.3)] px-4 py-3 text-[14px] text-text placeholder:text-faint outline-none transition-colors"
              />
              {fieldErrors.confirm && (
                <p className="mt-1.5 text-[12px] text-danger-fg">
                  {fieldErrors.confirm}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-accent-gradient text-[15px] font-semibold text-white shadow-btn-primary transition-all duration-150 ease-smooth hover:-translate-y-[2px] hover:shadow-btn-primary-hover active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-btn-primary"
            >
              {loading ? (
                <span className="flex gap-1">
                  <span
                    className="h-1 w-1 animate-pulse-dot rounded-full bg-current opacity-30"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1 w-1 animate-pulse-dot rounded-full bg-current opacity-30"
                    style={{ animationDelay: "200ms" }}
                  />
                  <span
                    className="h-1 w-1 animate-pulse-dot rounded-full bg-current opacity-30"
                    style={{ animationDelay: "400ms" }}
                  />
                </span>
              ) : (
                "Create account"
              )}
            </button>

            {formError && (
              <div className="mt-4 rounded-md border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-3.5 py-2.5 text-[13px] text-danger-fg">
                {formError}
              </div>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-[14px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
