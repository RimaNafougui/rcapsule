import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";
import {
  profilePutSchema,
  type ProfilePutInput,
} from "@/lib/validations/schemas";

export async function GET(_req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    const { data: user, error } = await supabase
      .from("User")
      .select(
        `
        id,
        name,
        username,
        email,
        bio,
        location,
        website,
        image,
        "coverImage",
        "instagramHandle",
        "tiktokHandle",
        "pinterestHandle",
        "styleTags",
        "profilePublic",
        "showClosetValue",
        "showItemPrices",
        "allowMessages",
        "subscription_status",
        "subscription_period_end"
      `,
      )
      .eq("id", session.user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure styleTags is always an array (Supabase might return null if empty)
    const sanitizedUser = {
      ...user,
      styleTags: user.styleTags || [],
    };

    return NextResponse.json(sanitizedUser);
  } catch (error) {
    console.error("Error fetching profile settings:", error);

    return NextResponse.json(
      { error: "Failed to fetch profile settings" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const result = profilePutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 },
      );
    }

    const data = result.data;
    const supabase = getSupabaseServer();

    // ProfilePutInput is z.infer<typeof profilePutSchema> — all fields optional.
    // Intersecting with `{ updatedAt: string }` keeps the type narrow while
    // allowing the timestamp field that Supabase expects but the schema omits.
    const updateData: Partial<ProfilePutInput> & { updatedAt: string } = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.bio !== undefined) updateData.bio = data.bio;

    if (data.location !== undefined) updateData.location = data.location;
    if (data.website !== undefined) updateData.website = data.website;

    if (data.instagramHandle !== undefined)
      updateData.instagramHandle = data.instagramHandle;
    if (data.tiktokHandle !== undefined)
      updateData.tiktokHandle = data.tiktokHandle;
    if (data.pinterestHandle !== undefined)
      updateData.pinterestHandle = data.pinterestHandle;
    if (data.styleTags !== undefined) updateData.styleTags = data.styleTags; // Expecting string[]
    if (data.profilePublic !== undefined)
      updateData.profilePublic = data.profilePublic;
    if (data.showClosetValue !== undefined)
      updateData.showClosetValue = data.showClosetValue;
    if (data.showItemPrices !== undefined)
      updateData.showItemPrices = data.showItemPrices;
    if (data.allowMessages !== undefined)
      updateData.allowMessages = data.allowMessages;

    const { data: user, error } = await supabase
      .from("User")
      .update(updateData)
      .eq("id", session.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505" && error.message?.includes("username")) {
        return NextResponse.json(
          { error: "This username is already taken. Please choose another." },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
