/**
 * Bulk background removal for all GlobalProduct catalogue images.
 *
 * Usage:
 *   pnpm tsx scripts/remove-bg-catalogue.ts
 *
 * Requires in your environment (.env.local or shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   AWS_LAMBDA_FUNCTION_NAME  (e.g. remove-background)
 *   AWS_REGION                (e.g. us-east-1)
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const BATCH_SIZE = 5;
const BUCKET = "catalog-images";

const lambda = new LambdaClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function fetchImageAsBase64(
  url: string,
  page: import("playwright").Page,
): Promise<{ base64: string; contentType: string }> {
  // Force JPEG so Lambda's Pillow can always identify the image
  const normalizedUrl = url.replace(/\bf_auto\b/g, "f_jpg");
  const response = await page.goto(normalizedUrl, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  if (!response || !response.ok()) {
    throw new Error(`Failed to fetch image (${response?.status()}): ${url}`);
  }

  const buffer = await response.body();
  const contentType = response.headers()["content-type"] || "image/jpeg";
  const base64 = `data:${contentType};base64,${buffer.toString("base64")}`;

  return { base64, contentType };
}

async function removeBackground(base64Image: string): Promise<string> {
  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (!functionName) throw new Error("AWS_LAMBDA_FUNCTION_NAME is not set");

  const rawBase64 = base64Image.replace(/^data:[^;]+;base64,/, "");

  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify({
      body: JSON.stringify({ imageBase64: rawBase64 }),
    }),
  });

  const response = await lambda.send(command);

  if (response.FunctionError) {
    const errPayload = new TextDecoder().decode(response.Payload);
    throw new Error(`Lambda error: ${errPayload}`);
  }

  const result = JSON.parse(new TextDecoder().decode(response.Payload));
  const body =
    typeof result.body === "string" ? JSON.parse(result.body) : result.body;

  if (!body.image)
    throw new Error(`Lambda returned no image. Body: ${JSON.stringify(body)}`);

  return body.image as string; // base64 data URL
}

async function uploadToStorage(
  productId: string,
  base64DataUrl: string,
): Promise<string> {
  // Strip the data URL prefix to get raw base64
  const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!matches) throw new Error("Invalid base64 data URL from Lambda");

  const contentType = matches[1];
  const ext = contentType.split("/")[1]?.split("+")[0] || "png";
  const buffer = Buffer.from(matches[2], "base64");
  const path = `${productId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

async function processProduct(
  product: { id: string; imageurl: string },
  page: import("playwright").Page,
): Promise<void> {
  const { base64 } = await fetchImageAsBase64(product.imageurl, page);
  const processedBase64 = await removeBackground(base64);
  const publicUrl = await uploadToStorage(product.id, processedBase64);

  const { error } = await supabase
    .from("GlobalProduct")
    .update({ processed_image_url: publicUrl })
    .eq("id", product.id);

  if (error) throw new Error(`DB update failed: ${error.message}`);
}

async function main() {
  console.log("Fetching unprocessed catalogue products...");

  const { data: products, error } = await supabase
    .from("GlobalProduct")
    .select("id, imageurl")
    .not("imageurl", "is", null)
    .is("processed_image_url", null);

  if (error) {
    console.error("Failed to fetch products:", error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("No unprocessed products found.");
    return;
  }

  console.log(`Found ${products.length} products to process.\n`);

  let succeeded = 0;
  let failed = 0;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  try {
    const warmupPage = await context.newPage();
    console.log("Warming up session on aritzia.com...");
    await warmupPage.goto("https://www.aritzia.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await warmupPage.close();
    console.log("Session ready.\n");

    // One page per concurrent worker, sharing the same cookie context
    const pages = await Promise.all(
      Array.from({ length: BATCH_SIZE }, () => context.newPage()),
    );

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (product, j) => {
          const page = pages[j];

          try {
            await processProduct(product, page);
            succeeded++;
            console.log(
              `✓ [${succeeded + failed}/${products.length}] ${product.id}`,
            );
          } catch (err) {
            failed++;
            console.error(
              `✗ [${succeeded + failed}/${products.length}] ${product.id} — ${err instanceof Error ? err.message : err}`,
            );
          }
        }),
      );
    }
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed.`);
}

main();
