import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  // Exchange the code so Supabase marks the email as confirmed
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to login with onboarding as the post-login destination
  return NextResponse.redirect(`${origin}/login?callbackUrl=/onboarding`);
}
