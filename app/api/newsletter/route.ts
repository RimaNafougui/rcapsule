import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { resend, FROM_EMAIL } from "@/lib/resend";
import { NewsletterWelcome } from "@/emails/NewsletterWelcome";
import { publicLimiter } from "@/lib/ratelimit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  // Rate-limit by IP
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await publicLimiter().limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;

  try {
    // Add to Resend Audience (contact list) if configured
    if (process.env.RESEND_AUDIENCE_ID) {
      await resend.contacts.create({
        email,
        audienceId: process.env.RESEND_AUDIENCE_ID,
        unsubscribed: false,
      });
    }

    // Send welcome email
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "You're on the list.",
      react: NewsletterWelcome({ email }),
    });

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Newsletter subscription error:", err);

    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 },
    );
  }
}
