import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST() {
  try {
    const session = await auth();

    console.log("Session:", session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    const { data: user, error: dbError } = await supabase
      .from("User")
      .select("stripe_customer_id")
      .eq("id", session.user.id)
      .single();

    console.log("User from DB:", user);
    console.log("DB Error:", dbError);

    if (!user?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 },
      );
    }

    console.log("Creating portal for customer:", user.stripe_customer_id);
    console.log(
      "Return URL:",
      `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    );

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    console.log("Portal URL:", portalSession.url);

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Portal error:", error);

    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
