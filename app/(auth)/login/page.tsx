"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/ui/Wordmark";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = "Enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "That email looks off.";
    if (!password) errs.password = "Enter your password.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    setLoading(false);

    if (error) {
      setFormError(error.message || "We could not sign you in.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-[400px] rounded-xl border border-border bg-surface p-10">
      <h1 className="text-[24px] font-bold leading-tight text-text">Sign in</h1>
      <p className="mb-8 mt-1 text-[14px] text-muted">
        Welcome back. Pick up where you left off.
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

        <div className="mb-2">
          <label
            htmlFor="password"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-faint"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full rounded-md border border-border bg-[rgba(0,0,0,0.3)] px-4 py-3 text-[14px] text-text placeholder:text-faint outline-none transition-colors"
          />
          {fieldErrors.password && (
            <p className="mt-1.5 text-[12px] text-danger-fg">
              {fieldErrors.password}
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
            "Sign in"
          )}
        </button>

        {formError && (
          <div className="mt-4 rounded-md border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-3.5 py-2.5 text-[13px] text-danger-fg">
            {formError}
          </div>
        )}
      </form>
    </div>
  );
}

export default function LoginPage() {
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

        <Suspense
          fallback={
            <div className="w-full max-w-[400px] rounded-xl border border-border bg-surface p-10">
              <div className="h-5 w-24 animate-pulse rounded bg-surface-2" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-[14px] text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
