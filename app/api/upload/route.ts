import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "clothes";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed",
        },
        { status: 400 },
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();

    // Create unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${session.user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: _data, error } = await supabase.storage
      .from("wardrobe-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);

      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from("wardrobe-images")
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
    });
  } catch (error) {
    console.error("Error uploading file:", error);

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    if (!path.startsWith(session.user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase.storage
      .from("wardrobe-images")
      .remove([path]);

    if (error) {
      console.error("Delete error:", error);

      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
