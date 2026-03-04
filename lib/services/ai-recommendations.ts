import type { WeatherContext } from "./weather";

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  colors: string[];
  season: string[];
  placesToWear: string[];
  style?: string;
  materials?: string[];
  imageUrl?: string;
}

export interface OutfitRecommendation {
  items: {
    id: string;
    name: string;
    category: string;
    imageUrl?: string;
    reason: string;
  }[];
  reasoning: string;
  styleNotes: string;
  weatherConsiderations: string;
  alternativeIds?: string[];
}

interface RecommendationContext {
  weather: WeatherContext;
  occasion?: string;
  userPreferences?: {
    styleGoals?: string[];
    preferredColors?: string[];
  };
  recentlyWorn?: string[];
}

// Build the prompt for the AI
function buildPrompt(
  clothes: ClothingItem[],
  context: RecommendationContext,
): string {
  const { weather, occasion, userPreferences, recentlyWorn } = context;

  // Format clothes inventory for the prompt
  const clothesInventory = clothes.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    colors: item.colors?.join(", ") || "unknown",
    seasons: item.season?.join(", ") || "all-season",
    occasions: Array.isArray(item.placesToWear)
      ? item.placesToWear.join(", ")
      : item.placesToWear || "any",
    style: item.style || "casual",
    materials: Array.isArray(item.materials)
      ? item.materials.join(", ")
      : item.materials || "unknown",
  }));

  // Build weather description
  const weatherDesc = `
Temperature: ${weather.current.temperature}°C (feels like ${weather.current.feelsLike}°C)
Conditions: ${weather.current.description}
High/Low: ${weather.high}°C / ${weather.low}°C
Rain chance: ${weather.current.precipitation}%
${weather.isCold ? "It's cold today - warm layers needed." : ""}
${weather.isHot ? "It's hot today - breathable fabrics recommended." : ""}
${weather.needsUmbrella ? "Rain expected - water-resistant options preferred." : ""}
${weather.needsLayers ? "Large temperature swing - layering recommended." : ""}
`.trim();

  // Build occasion context
  const occasionDesc = occasion
    ? `The user has ${occasion} planned today.`
    : "No specific occasion mentioned - suggest a versatile everyday outfit.";

  // Build style preferences
  const styleDesc = userPreferences?.styleGoals?.length
    ? `User's style preferences: ${userPreferences.styleGoals.join(", ")}`
    : "";

  // Recently worn items to avoid
  const avoidDesc = recentlyWorn?.length
    ? `Avoid these items (recently worn): ${recentlyWorn.join(", ")}`
    : "";

  return `You are a personal stylist AI helping a user choose what to wear today.

## Today's Weather
${weatherDesc}

## Context
${occasionDesc}
${styleDesc}
${avoidDesc}

## User's Wardrobe
${JSON.stringify(clothesInventory, null, 2)}

## Your Task
Recommend a complete outfit from the user's wardrobe that:
1. Is appropriate for today's weather conditions
2. Matches the occasion (or is versatile if none specified)
3. Creates a cohesive, stylish look
4. Uses items they haven't worn recently (if specified)

## Response Format
Respond with a JSON object in this exact format:
{
  "items": [
    {
      "id": "item-uuid",
      "name": "Item Name",
      "category": "category",
      "reason": "Why this item works for today"
    }
  ],
  "reasoning": "2-3 sentences explaining the overall outfit choice",
  "styleNotes": "Brief styling tip for wearing this outfit",
  "weatherConsiderations": "How this outfit handles today's weather",
  "alternativeIds": ["id1", "id2"]
}

Include at minimum: 1 top, 1 bottom (unless it's a dress/jumpsuit), and optionally outerwear/accessories if weather requires.
Only use item IDs that exist in the wardrobe provided.
Keep explanations concise but helpful.`;
}

// Call OpenAI API
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a fashion-savvy AI stylist. Always respond with valid JSON only, no markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      `OpenAI API error: ${error.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();

  return data.choices[0].message.content;
}

// Alternative: Call Anthropic Claude API
async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content:
            prompt +
            "\n\nRespond with valid JSON only, no explanation or markdown.",
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      `Claude API error: ${error.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();

  return data.content[0].text;
}

// Main recommendation function
export async function getOutfitRecommendation(
  clothes: ClothingItem[],
  context: RecommendationContext,
  provider: "openai" | "anthropic" = "openai",
): Promise<OutfitRecommendation> {
  // Filter to only owned clothes (not wishlist)
  const ownedClothes = clothes.filter(
    (item: any) => item.status !== "wishlist",
  );

  if (ownedClothes.length < 2) {
    throw new Error("Not enough clothes in wardrobe to make a recommendation");
  }

  const prompt = buildPrompt(ownedClothes, context);

  let responseText: string;

  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    responseText = await callClaude(prompt);
  } else {
    responseText = await callOpenAI(prompt);
  }

  // Parse the JSON response
  try {
    // Clean up response if it has markdown code blocks
    let cleanJson = responseText.trim();

    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.slice(0, -3);
    }

    const recommendation = JSON.parse(cleanJson.trim()) as OutfitRecommendation;

    // Validate that returned IDs exist in the clothes array
    const clothesIds = new Set(ownedClothes.map((c) => c.id));

    recommendation.items = recommendation.items.filter((item) =>
      clothesIds.has(item.id),
    );

    // Enrich with image URLs from original data
    recommendation.items = recommendation.items.map((item) => {
      const originalItem = ownedClothes.find((c) => c.id === item.id);

      return {
        ...item,
        imageUrl: originalItem?.imageUrl,
      };
    });

    return recommendation;
  } catch (_parseError) {
    console.error("Failed to parse AI response:", responseText);
    throw new Error("Failed to parse outfit recommendation");
  }
}

// Get multiple outfit options
export async function getOutfitOptions(
  clothes: ClothingItem[],
  context: RecommendationContext,
  count: number = 3,
): Promise<OutfitRecommendation[]> {
  const results: OutfitRecommendation[] = [];
  const usedItemIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    try {
      // Add previously recommended items to "recently worn" to get variety
      const modifiedContext = {
        ...context,
        recentlyWorn: [
          ...(context.recentlyWorn || []),
          ...Array.from(usedItemIds),
        ],
      };

      const recommendation = await getOutfitRecommendation(
        clothes,
        modifiedContext,
      );

      results.push(recommendation);

      // Track used items for variety
      recommendation.items.forEach((item) => usedItemIds.add(item.id));
    } catch (error) {
      console.error(`Failed to get recommendation ${i + 1}:`, error);
      // Continue trying to get more recommendations
    }
  }

  return results;
}
