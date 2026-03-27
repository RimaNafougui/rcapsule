// ─── Loops Billing Email Extensions ──────────────────────────────────────────
// Drop these cases into your existing Stripe webhook handler's switch statement.
// Import the send functions at the top of your existing webhook route file.
//
// Usage: copy the imports and the handleStripeLoopsEvents call into your
// existing /app/api/webhooks/stripe/route.ts file.

import Stripe from "stripe";

import {
  sendInvoiceReceipt,
  sendSubscriptionStarted,
  sendSubscriptionCancelled,
  sendSubscriptionUpdated,
  syncContact,
} from "@/lib/email/loops";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Retrieves customer email and name from Stripe.
// Replace with a DB lookup if you already store this in Supabase.
async function getCustomer(
  customerId: string,
): Promise<{ email: string | null; name: string | null }> {
  const stripe = new (await import("stripe")).default(
    process.env.STRIPE_SECRET_KEY!,
  );
  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted) return { email: null, name: null };
  const c = customer as Stripe.Customer;

  return {
    email: c.email ?? null,
    name: c.name ?? null, // coerce undefined → null
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────
// Call this from inside your existing switch(event.type) block, or add these
// cases directly to it.

export async function handleStripeLoopsEvents(event: Stripe.Event) {
  switch (event.type) {
    // ─── Invoice Paid ─────────────────────────────────────────────────────────
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;

      // Skip $0 invoices (e.g. free trial activations)
      if (!invoice.amount_paid) break;

      // invoice.customer_email is the correct field in stripe@17+
      const email = invoice.customer_email;

      if (!email) break;

      const lineItem = invoice.lines.data[0];
      const planName = lineItem?.description ?? "RCapsule Pro";

      // period_start / period_end live on the invoice itself as fallback
      const periodStart = lineItem?.period?.start ?? 0;
      const periodEnd = lineItem?.period?.end ?? 0;

      await sendInvoiceReceipt({
        email,
        invoiceId: invoice.number ?? invoice.id,
        invoiceUrl: invoice.hosted_invoice_url ?? "",
        amountPaid: formatAmount(invoice.amount_paid, invoice.currency),
        billingPeriodStart: formatDate(periodStart),
        billingPeriodEnd: formatDate(periodEnd),
        planName,
      });
      break;
    }

    // ─── Subscription Created ─────────────────────────────────────────────────
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      const customer = await getCustomer(subscription.customer as string);

      if (!customer.email) break;

      const item = subscription.items.data[0];
      const planName = item?.price?.nickname ?? "RCapsule Pro";
      const interval =
        item?.price?.recurring?.interval === "year" ? "yearly" : "monthly";

      // current_period_end moved to subscription items in stripe@17+
      const periodEnd =
        (item as unknown as { current_period_end?: number })
          ?.current_period_end ?? subscription.billing_cycle_anchor;

      await sendSubscriptionStarted({
        email: customer.email,
        firstName: customer.name?.split(" ")[0],
        planName,
        billingInterval: interval,
        nextBillingDate: formatDate(periodEnd),
      });

      await syncContact({
        email: customer.email,
        firstName: customer.name?.split(" ")[0],
        planTier: "pro",
        subscriptionStatus:
          subscription.status === "trialing" ? "trialing" : "active",
      });
      break;
    }

    // ─── Subscription Cancelled ───────────────────────────────────────────────
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customer = await getCustomer(subscription.customer as string);

      if (!customer.email) break;

      const item = subscription.items.data[0];
      const planName = item?.price?.nickname ?? "RCapsule Pro";

      const periodEnd =
        (item as unknown as { current_period_end?: number })
          ?.current_period_end ?? subscription.billing_cycle_anchor;

      await sendSubscriptionCancelled({
        email: customer.email,
        firstName: customer.name?.split(" ")[0],
        planName,
        accessUntil: formatDate(periodEnd),
      });

      await syncContact({
        email: customer.email,
        planTier: "free",
        subscriptionStatus: "cancelled",
      });
      break;
    }

    // ─── Subscription Updated (plan change / upgrade / downgrade) ─────────────
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const previousAttributes = event.data
        .previous_attributes as Partial<Stripe.Subscription>;

      // Only notify when the price/plan actually changed, not on every renewal
      if (!previousAttributes?.items) break;

      const customer = await getCustomer(subscription.customer as string);

      if (!customer.email) break;

      const newItem = subscription.items.data[0];
      const newPlanName = newItem?.price?.nickname ?? "RCapsule Pro";
      // Retrieve old plan name from your DB if you persist it; fallback below
      const oldPlanName = "Previous Plan";

      await sendSubscriptionUpdated({
        email: customer.email,
        firstName: customer.name?.split(" ")[0],
        oldPlanName,
        newPlanName,
        effectiveDate: formatDate(Math.floor(Date.now() / 1000)),
      });

      await syncContact({
        email: customer.email,
        subscriptionStatus: subscription.status as
          | "active"
          | "trialing"
          | "past_due",
      });
      break;
    }
  }
}
