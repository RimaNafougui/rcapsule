import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { auth } from "@/auth";
import { authLimiter, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";
import { getErrorMessage } from "@/lib/utils/error";

export async function PUT(req: Request) {
  const { success, reset } = await authLimiter().limit(getIdentifier(req));

  if (!success) return rateLimitResponse(reset);

  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    if (!data.currentPassword || !data.newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 },
      );
    }

    if (
      data.newPassword.length < 8 ||
      !/[A-Z]/.test(data.newPassword) ||
      !/[a-z]/.test(data.newPassword) ||
      !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(data.newPassword)
    ) {
      return NextResponse.json(
        {
          error:
            "New password must be at least 8 characters and include uppercase, lowercase, and a number or symbol",
        },
        { status: 400 },
      );
    }
    const tempClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error: verifyError } = await tempClient.auth.signInWithPassword({
      email: session.user.email,
      password: data.currentPassword,
    });

    if (verifyError) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      session.user.id,
      { password: data.newPassword },
    );

    if (updateError) {
      throw updateError;
    }

    await adminClient
      .from("User")
      .update({ updatedAt: new Date().toISOString() })
      .eq("id", session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to change password" },
      { status: 500 },
    );
  }
}
