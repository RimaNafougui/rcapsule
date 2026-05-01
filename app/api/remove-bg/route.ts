import { NextResponse } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

import { auth } from "@/auth";
import { heavyLimiter, rateLimitResponse } from "@/lib/ratelimit";

const lambda = new LambdaClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success, reset } = await heavyLimiter().limit(
    `user:${session.user.id}`,
  );

  if (!success) return rateLimitResponse(reset);

  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (!functionName) {
    return NextResponse.json(
      { error: "Background removal is not configured" },
      { status: 503 },
    );
  }

  const { imageUrl } = await req.json();

  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  try {
    // Fetch the image server-side so we avoid CORS issues from the browser
    const imgRes = await fetch(imageUrl);

    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Could not fetch the source image" },
        { status: 422 },
      );
    }

    const buffer = await imgRes.arrayBuffer();
    const rawBase64 = Buffer.from(buffer).toString("base64");

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({
        body: JSON.stringify({ imageBase64: rawBase64 }),
      }),
    });

    const lambdaRes = await lambda.send(command);

    if (lambdaRes.FunctionError) {
      const detail = new TextDecoder().decode(lambdaRes.Payload);

      throw new Error(`Lambda error: ${detail}`);
    }

    const parsed = JSON.parse(new TextDecoder().decode(lambdaRes.Payload));
    const body =
      typeof parsed.body === "string" ? JSON.parse(parsed.body) : parsed.body;

    if (!body?.image) throw new Error("Lambda returned no image");

    const dataUrl = body.image.startsWith("data:")
      ? body.image
      : `data:image/png;base64,${body.image}`;

    return NextResponse.json({ image: dataUrl });
  } catch (err) {
    console.error("[POST /api/remove-bg]", err);

    return NextResponse.json(
      { error: "Background removal failed" },
      { status: 500 },
    );
  }
}
