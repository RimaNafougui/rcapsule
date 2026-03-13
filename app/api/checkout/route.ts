import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { billingCycle } = await request.json();

    if (billingCycle !== "monthly" && billingCycle !== "yearly") {
      return NextResponse.json(
        { error: "Invalid billing cycle" },
        { status: 400 },
      );
    }

    // Evaluated at request time so env stubs work in tests and runtime changes
    // (e.g. staging vs prod) are picked up without a redeploy.
    const PRICE_IDS: Record<string, string | undefined> = {
      monthly: process.env.STRIPE_PRICE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_YEARLY,
    };

    const priceId = PRICE_IDS[billingCycle];

    if (!priceId) {
      return NextResponse.json(
        { error: "Checkout unavailable — Stripe price not configured" },
        { status: 500 },
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: session.user.email || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing`,
      metadata: {
        userId: session.user.id,
      },
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const stripeMessage =
      error instanceof Stripe.errors.StripeError
        ? `${error.type}: ${error.message}`
        : String(error);

    return NextResponse.json(
      { error: "Failed to create checkout session", detail: stripeMessage },
      { status: 500 },
    );
  }
}
