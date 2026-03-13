import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { resend } from "@/lib/resend";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;

  try {
    // Mark the contact as unsubscribed in Resend Audience.
    // contacts.create is an upsert — if the email already exists it updates it.
    if (process.env.RESEND_AUDIENCE_ID) {
      await resend.contacts.create({
        email,
        audienceId: process.env.RESEND_AUDIENCE_ID,
        unsubscribed: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unsubscribe error:", err);

    // Still return success — we don't want to expose internal errors
    // and the user expects to be unsubscribed regardless.
    return NextResponse.json({ success: true });
  }
}
