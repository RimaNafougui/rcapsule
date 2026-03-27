import { NextRequest, NextResponse } from "next/server";

import {
  sendEmailVerification,
  sendPasswordReset,
  sendEmailChange,
  syncContact,
} from "@/lib/email/loops";

// ─── Supabase Auth Hook ───────────────────────────────────────────────────────
// Supabase fires a POST to this route on auth events when configured under:
// Supabase Dashboard > Authentication > Hooks
//
// Hook type to configure: "Send Email"
// This replaces Supabase's built-in SMTP email sending entirely.
//
// IMPORTANT: Set SUPABASE_HOOK_SECRET in your environment variables and
// add it as the "secret" value when configuring the hook in Supabase.

const HOOK_SECRET = process.env.SUPABASE_HOOK_SECRET;

// ─── Supabase hook payload shape ──────────────────────────────────────────────

type AuthHookEvent =
  | "signup"
  | "login"
  | "magiclink"
  | "recovery"
  | "invite"
  | "email_change";

interface SupabaseAuthHookPayload {
  type: AuthHookEvent;
  email: string;
  data: {
    token?: string; // OTP token (not used here, we use token_hash)
    token_hash?: string; // used to construct confirmation URLs
    redirect_to?: string;
    email_change_email?: string; // new email address for email_change events
  };
  user_metadata?: {
    first_name?: string;
    full_name?: string;
  };
}

// ─── URL Builders ─────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://rcapsule.com";

function buildConfirmationUrl(
  tokenHash: string,
  type: string,
  redirectTo?: string,
) {
  const url = new URL(`${APP_URL}/auth/confirm`);

  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  if (redirectTo) url.searchParams.set("next", redirectTo);

  return url.toString();
}

function buildResetUrl(tokenHash: string) {
  const url = new URL(`${APP_URL}/auth/confirm`);

  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "recovery");
  url.searchParams.set("next", "/account/reset-password");

  return url.toString();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Verify the hook secret to ensure the request is from Supabase
  const authHeader = req.headers.get("authorization");

  if (HOOK_SECRET && authHeader !== `Bearer ${HOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SupabaseAuthHookPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, email, data, user_metadata } = payload;
  const firstName =
    user_metadata?.first_name ??
    user_metadata?.full_name?.split(" ")[0] ??
    undefined;

  try {
    switch (type) {
      // ─── Email Verification on Signup ───────────────────────────────────────
      case "signup": {
        if (!data.token_hash) break;

        const confirmationUrl = buildConfirmationUrl(
          data.token_hash,
          "signup",
          data.redirect_to,
        );

        await sendEmailVerification({ email, firstName, confirmationUrl });

        // Also sync the contact to Loops so they appear in your audience
        await syncContact({
          email,
          firstName,
          signedUpAt: new Date().toISOString(),
          planTier: "free",
          subscriptionStatus: undefined,
        });

        break;
      }

      // ─── Magic Link Login ────────────────────────────────────────────────────
      // Treated the same as verification — reuses the email verification template.
      case "magiclink": {
        if (!data.token_hash) break;

        const confirmationUrl = buildConfirmationUrl(
          data.token_hash,
          "magiclink",
          data.redirect_to,
        );

        await sendEmailVerification({ email, firstName, confirmationUrl });
        break;
      }

      // ─── Password Reset ──────────────────────────────────────────────────────
      case "recovery": {
        if (!data.token_hash) break;

        const resetUrl = buildResetUrl(data.token_hash);

        await sendPasswordReset({ email, firstName, resetUrl });
        break;
      }

      // ─── Email Change ────────────────────────────────────────────────────────
      // Supabase sends this event to the OLD email address for confirmation.
      case "email_change": {
        if (!data.token_hash || !data.email_change_email) break;

        const confirmationUrl = buildConfirmationUrl(
          data.token_hash,
          "email_change",
        );

        await sendEmailChange({
          email, // old email (receives confirmation)
          firstName,
          newEmail: data.email_change_email, // new email they want to switch to
          confirmationUrl,
        });
        break;
      }

      // ─── Invite ──────────────────────────────────────────────────────────────
      // Reuses the verification template. Extend with a dedicated
      // invite template later if RCapsule adds team/invite features.
      case "invite": {
        if (!data.token_hash) break;

        const confirmationUrl = buildConfirmationUrl(
          data.token_hash,
          "invite",
          data.redirect_to,
        );

        await sendEmailVerification({ email, firstName, confirmationUrl });
        break;
      }

      default:
        console.warn(`[auth-hook] Unhandled event type: ${type}`);
    }

    // Supabase expects a 200 with success: true to confirm the hook was handled
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[auth-hook] Failed to send email:", err);

    // Return 500 so Supabase knows delivery failed and can retry
    return NextResponse.json(
      { error: "Email delivery failed" },
      { status: 500 },
    );
  }
}
