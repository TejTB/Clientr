type EnvShape = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ANTHROPIC_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_ID: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
};

const REQUIRED_KEYS: (keyof EnvShape)[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_APP_URL"
];

let _cache: EnvShape | null = null;

export function getEnv(): EnvShape {
  if (_cache) return _cache;

  const missing: string[] = [];
  const out: Partial<EnvShape> = {};
  for (const key of REQUIRED_KEYS) {
    const val = process.env[key];
    if (!val || !val.trim()) {
      missing.push(key);
    } else {
      out[key] = val;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables: ${missing.join(", ")}. ` +
        `Copy .env.example to .env.local and fill in real values.`
    );
  }

  _cache = out as EnvShape;
  return _cache;
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = getAppUrl();
  try {
    const a = new URL(allowed).origin;
    const o = new URL(origin).origin;
    return a === o;
  } catch {
    return false;
  }
}
