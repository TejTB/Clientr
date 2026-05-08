import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProfileUpdate = {
  plan?: "free" | "pro";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  searches_used?: number;
  searches_reset_at?: string;
};

async function findProfileId(
  customerId: string | null,
  supabaseId: string | null
): Promise<string | null> {
  const admin = createAdminClient();
  if (customerId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }
  if (supabaseId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("id", supabaseId)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }
  return null;
}

async function applyUpdate(profileId: string, patch: ProfileUpdate) {
  const admin = createAdminClient();
  await admin.from("profiles").update(patch).eq("id", profileId);
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new NextResponse("missing_secret", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new NextResponse("missing_signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return new NextResponse("bad_signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;
        const supabaseId =
          (session.metadata?.supabase_id as string | undefined) ?? null;

        const profileId = await findProfileId(customerId, supabaseId);
        if (profileId) {
          await applyUpdate(profileId, {
            plan: "pro",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            searches_used: 0,
            searches_reset_at: new Date().toISOString()
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const supabaseId =
          (sub.metadata?.supabase_id as string | undefined) ?? null;
        const profileId = await findProfileId(customerId, supabaseId);
        if (!profileId) break;

        const status = sub.status;
        if (status === "active" || status === "trialing" || status === "past_due") {
          await applyUpdate(profileId, {
            plan: "pro",
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId
          });
        } else if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
          await applyUpdate(profileId, {
            plan: "free",
            stripe_subscription_id: null
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const supabaseId =
          (sub.metadata?.supabase_id as string | undefined) ?? null;
        const profileId = await findProfileId(customerId, supabaseId);
        if (profileId) {
          await applyUpdate(profileId, {
            plan: "free",
            stripe_subscription_id: null
          });
        }
        break;
      }

      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const supabaseId =
          (sub.metadata?.supabase_id as string | undefined) ?? null;
        const profileId = await findProfileId(customerId, supabaseId);
        if (!profileId) break;

        if (sub.status === "active" || sub.status === "trialing") {
          await applyUpdate(profileId, {
            plan: "pro",
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    return new NextResponse("handler_error", { status: 500 });
  }

  return new NextResponse("ok", { status: 200 });
}
