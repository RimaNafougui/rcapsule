import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { signupSchema } from "@/lib/validations/schemas";
import { authLimiter, getIdentifier, rateLimitResponse } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const { success, reset } = await authLimiter().limit(getIdentifier(req));

  if (!success) return rateLimitResponse(reset);

  try {
    const supabase = getSupabaseServer();
    const body = await req.json();

    const result = signupSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const first = Object.values(fieldErrors).flat()[0];

      return NextResponse.json(
        { error: first ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { email, password, name, username } = result.data;

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from("User")
      .select("id")
      .ilike("username", username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 },
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
          username: username.toLowerCase(),
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData?.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 400 },
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: existingRecord, error: _dbError } = await supabase
      .from("User")
      .select("id")
      .eq("id", authData.user.id)
      .single();

    if (existingRecord) {
      // Trigger already created the row — patch in the username and name
      await supabase
        .from("User")
        .update({
          username: username.toLowerCase(),
          name: name || null,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", authData.user.id);
    } else if (_dbError) {
      // No trigger — insert the row manually
      const { error: insertError } = await supabase.from("User").insert({
        id: authData.user.id,
        email: authData.user.email!,
        name: name || null,
        username: username.toLowerCase(),
        emailVerified: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (insertError) {
        if (
          insertError.code === "23505" &&
          insertError.message?.includes("username")
        ) {
          return NextResponse.json(
            { error: "Username is already taken" },
            { status: 400 },
          );
        }
      }
    }

    return NextResponse.json(
      {
        message:
          "User created successfully. Please check your email to verify your account.",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          username: username.toLowerCase(),
        },
      },
      { status: 201 },
    );
  } catch (_error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
