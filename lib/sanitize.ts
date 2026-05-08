import { getAppUrl } from "@/lib/env";

export const ICP_MAX_CHARS = 500;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

export function sanitizeIcpQuery(input: unknown): string {
  if (typeof input !== "string") return "";
  let cleaned = input.replace(CONTROL_CHARS, "");
  cleaned = cleaned.replace(/[ \t]+/g, " ").trim();
  if (cleaned.length > ICP_MAX_CHARS) {
    cleaned = cleaned.slice(0, ICP_MAX_CHARS).trim();
  }
  return cleaned;
}

/**
 * Inspect the request and report which gate (if any) it would pass.
 * Used for diagnostic logging when a 403 fires.
 */
export interface OriginCheck {
  ok: boolean;
  matched: "configured" | "request-host" | "no-origin-no-referer" | null;
  origin: string | null;
  referer: string | null;
  forwardedHost: string | null;
  host: string | null;
  configuredAppUrl: string;
  reason?: string;
}

function originOf(input: string | null): string | null {
  if (!input) return null;
  try {
    return new URL(input).origin;
  } catch {
    return null;
  }
}

function requestHostOrigin(req: Request): string | null {
  const xfh = req.headers.get("x-forwarded-host");
  const host = xfh ?? req.headers.get("host");
  if (!host) return null;
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return null;
  }
}

/**
 * Same-origin gate that's robust to deployment-URL drift.
 *
 * Accepts the request if Origin (or Referer fallback) matches EITHER:
 *  - the configured NEXT_PUBLIC_APP_URL, or
 *  - the request's own host (x-forwarded-host / host header).
 *
 * The second condition handles Vercel preview/production deploys where
 * NEXT_PUBLIC_APP_URL may not exactly match the public hostname being hit.
 * Cross-origin attackers fail both conditions because their Origin won't match
 * the request's host either.
 */
export function inspectSameOrigin(req: Request): OriginCheck {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = req.headers.get("host");
  const configuredAppUrl = getAppUrl();

  const base: Omit<OriginCheck, "ok" | "matched"> = {
    origin,
    referer,
    forwardedHost,
    host,
    configuredAppUrl
  };

  // No Origin header is normal for same-origin GETs and many same-origin POSTs;
  // fall back to Referer. If neither, treat as same-origin (server-side
  // requests, curl etc. — auth still gates them).
  const candidate = origin ?? referer;
  if (!candidate) {
    return {
      ...base,
      ok: true,
      matched: "no-origin-no-referer"
    };
  }

  const candidateOrigin = originOf(candidate);
  if (!candidateOrigin) {
    return {
      ...base,
      ok: false,
      matched: null,
      reason: "candidate_unparseable"
    };
  }

  const configuredOrigin = originOf(configuredAppUrl);
  if (configuredOrigin && candidateOrigin === configuredOrigin) {
    return { ...base, ok: true, matched: "configured" };
  }

  const reqOrigin = requestHostOrigin(req);
  if (reqOrigin && candidateOrigin === reqOrigin) {
    return { ...base, ok: true, matched: "request-host" };
  }

  return {
    ...base,
    ok: false,
    matched: null,
    reason: "no_match"
  };
}

export function sameOrigin(req: Request): boolean {
  return inspectSameOrigin(req).ok;
}
