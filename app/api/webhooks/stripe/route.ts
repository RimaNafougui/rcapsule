import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

import { cacheGet, cacheSet } from "@/lib/redis";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { PremiumWelcome } from "@/emails/PremiumWelcome";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Idempotency guard ────────────────────────────────────────────────────
// Stripe retries webhooks on failure. We deduplicate using Redis with a 24h TTL.
async function isEventProcessed(eventId: string): Promise<boolean> {
  const key = `stripe_event:${eventId}`;
  const existing = await cacheGet<boolean>(key);

  return existing === true;
}

async function markEventProcessed(eventId: string): Promise<void> {
  await cacheSet(`stripe_event:${eventId}`, true, 86400); // 24 hours
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function updateSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  customerId?: string,
) {
  // current_period_end exists at runtime but TS types for the 2025 API version
  // expose it under a different path — cast to any to access it safely.
  const periodEndTs = (subscription as any).current_period_end as
    | number
    | undefined;
  const periodEnd = periodEndTs
    ? new Date(periodEndTs * 1000).toISOString()
    : null;

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";

  const { error } = await supabase
    .from("User")
    .update({
      subscription_status: isActive ? "premium" : "free",
      ...(customerId ? { stripe_customer_id: customerId } : {}),
      stripe_subscription_id: subscription.id,
      subscription_period_end: periodEnd,
    })
    .eq("id", userId);

  if (error) console.error("Failed to update user subscription:", error);
}

// ─── Handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);

    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: skip already-processed events
  if (await isEventProcessed(event.id)) {
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) {
          console.error("Missing userId or subscriptionId in checkout session");
          break;
        }

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        await updateSubscription(userId, subscription, customerId);

        // Send premium welcome email
        const customerEmail =
          typeof session.customer_details?.email === "string"
            ? session.customer_details.email
            : null;
        const customerName =
          typeof session.customer_details?.name === "string"
            ? session.customer_details.name
            : undefined;

        if (customerEmail) {
          resend.emails
            .send({
              from: FROM_EMAIL,
              to: customerEmail,
              subject: "Welcome to Rcapsule Premium",
              react: PremiumWelcome({ email: customerEmail, name: customerName }),
            })
            .catch((err) => console.error("Failed to send premium welcome email:", err));
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          // Fall back to looking up by stripe_subscription_id
          const { data: user } = await supabase
            .from("User")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (!user) {
            console.error("No user found for subscription:", subscription.id);
            break;
          }

          await updateSubscription(user.id, subscription);
          break;
        }

        await updateSubscription(userId, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: user } = await supabase
          .from("User")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (!user) {
          console.error(
            "No user found for deleted subscription:",
            subscription.id,
          );
          break;
        }

        const { error } = await supabase
          .from("User")
          .update({
            subscription_status: "free",
            subscription_period_end: null,
          })
          .eq("id", user.id);

        if (error)
          console.error("Failed to downgrade user subscription:", error);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // invoice.subscription moved in the 2025 Stripe API — access via any
        const invoiceSub = (invoice as any).subscription as
          | string
          | { id: string }
          | null;
        const subscriptionId =
          typeof invoiceSub === "string" ? invoiceSub : invoiceSub?.id;

        if (!subscriptionId) break;

        const { data: user } = await supabase
          .from("User")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (!user) break;

        // Mark as past_due — don't immediately downgrade to free
        const { error } = await supabase
          .from("User")
          .update({ subscription_status: "past_due" })
          .eq("id", user.id);

        if (error)
          console.error("Failed to mark subscription past_due:", error);
        break;
      }
    }

    await markEventProcessed(event.id);
  } catch (err) {
    console.error("Error processing webhook:", err);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
