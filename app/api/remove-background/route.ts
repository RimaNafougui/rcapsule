// app/api/remove-background/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const { data: user } = await supabase
      .from("User")
      .select("subscription_status")
      .eq("id", session.user.id)
      .single();

    if (user?.subscription_status !== "premium") {
      return NextResponse.json(
        { error: "Premium subscription required" },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    let base64Image: string;

    if (imageUrl) {
      // Validate URL to prevent SSRF – only allow public HTTPS hosts
      let parsedUrl: URL;

      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid image URL" },
          { status: 400 },
        );
      }

      if (parsedUrl.protocol !== "https:") {
        return NextResponse.json(
          { error: "Image URL must use HTTPS" },
          { status: 400 },
        );
      }

      // Block private/internal IP ranges and localhost
      const hostname = parsedUrl.hostname.toLowerCase();
      const blocked =
        /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1|0\.0\.0\.0)/.test(
          hostname,
        );

      if (blocked) {
        return NextResponse.json(
          { error: "Image URL points to a disallowed host" },
          { status: 400 },
        );
      }

      const imageResponse = await fetch(imageUrl, {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      });

      if (!imageResponse.ok) {
        throw new Error(
          `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`,
        );
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType =
        imageResponse.headers.get("content-type") || "image/jpeg";

      base64Image = `data:${contentType};base64,${base64}`;
    } else if (file) {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = file.type || "image/jpeg";

      base64Image = `data:${mimeType};base64,${base64}`;
    } else {
      return NextResponse.json(
        { error: "No file or URL provided" },
        { status: 400 },
      );
    }

    // Check if endpoint is configured
    if (!process.env.AWS_LAMBDA_ENDPOINT) {
      return NextResponse.json(
        { error: "Background removal service is not configured" },
        { status: 500 },
      );
    }

    // Call AWS Lambda function with base64 image
    const lambdaResponse = await fetch(process.env.AWS_LAMBDA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64: base64Image }),
    });

    if (!lambdaResponse.ok) {
      const error = await lambdaResponse.json();

      throw new Error(error.error || "Background removal failed");
    }

    const data = await lambdaResponse.json();

    return NextResponse.json({
      image: data.image,
      success: data.success,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove background",
      },
      { status: 500 },
    );
  }
}
