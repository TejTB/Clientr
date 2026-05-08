# CLIENTR

CLIENTR is an AI lead generation tool for creative agencies. Solo designers describe their ideal client profile, the app finds real prospects and writes the outreach. Free tier covers 3 searches and 10 leads. Pro is £29.99/month for unlimited usage.

## Stack

- Next.js 14 (App Router)
- Supabase (Postgres, Auth, RLS)
- Stripe (subscriptions, webhooks, billing portal)
- Anthropic Claude (prospect search, outreach copy)
- Tailwind CSS

## Setup

### 1. Clone and install

```
git clone <repo-url>
cd clientr
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The service role key is server-only. Never expose it to the browser.

### 3. Supabase

1. Create a project at supabase.com.
2. Open the SQL editor and run the contents of `supabase/schema.sql`. This creates the `profiles` and `leads` tables, RLS policies, triggers (auto-create profile on signup, leads count denormalisation), and updated_at handling.
3. In Authentication settings, enable email + password sign-in.
4. Add `http://localhost:3000/auth/callback` and your production callback URL to the allowed redirect URLs.
5. Copy the project URL, anon key, and service role key into `.env.local`.

### 4. Stripe

1. Create a Stripe account in test mode.
2. Create a product called "CLIENTR Pro" with a recurring price of £29.99/month, GBP.
3. Copy the price ID (looks like `price_...`) into `STRIPE_PRICE_ID`.
4. In Developers, create a webhook endpoint pointing to `http://localhost:3000/api/stripe/webhook` for local testing (use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`). Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
6. Copy the secret key into `STRIPE_SECRET_KEY` and the publishable key into `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
7. Enable the Customer Billing Portal in Stripe settings so the Manage billing flow works.

### 5. Run

```
npm run dev
```

Open http://localhost:3000.

## Database

Schema lives in `supabase/schema.sql`. Paste the entire file into the Supabase SQL editor and run it. The script is idempotent.

Key tables:
- `profiles` (1:1 with `auth.users`, holds plan and Stripe IDs)
- `leads` (per-user lead records)

RLS is enabled on both. The service-role client (used only in the Stripe webhook) bypasses RLS to update `profiles.plan`.

## Stripe wiring

- Checkout: `POST /api/stripe/checkout` creates a subscription session and returns `{ url }`.
- Portal: `POST /api/stripe/portal` creates a billing portal session for plan changes and cancellation.
- Webhook: `POST /api/stripe/webhook` verifies the signature and updates `profiles.plan`, `stripe_subscription_id`, and search counters.

The webhook reads the raw request body via `req.text()` and verifies it with `stripe.webhooks.constructEvent`.

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import into Vercel. Framework preset is Next.js.
3. Add every variable from `.env.example` to the Vercel project (Production and Preview).
4. Update `NEXT_PUBLIC_APP_URL` to your production URL.
5. After deploy, create a new Stripe webhook pointing to `https://<your-domain>/api/stripe/webhook` with the four events above. Copy the new signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.
6. Add the Vercel domain to Supabase allowed redirect URLs.
