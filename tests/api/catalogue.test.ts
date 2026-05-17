import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/catalogue/route";

// ── Mock rate limiter (always pass) ────────────────────────────────────────
vi.mock("@/lib/ratelimit", () => ({
  publicLimiter: () => ({
    limit: vi.fn().mockResolvedValue({ success: true, reset: 0 }),
  }),
  getIdentifier: vi.fn().mockReturnValue("ip:127.0.0.1"),
  rateLimitResponse: vi.fn(),
}));

// ── Mock Redis ─────────────────────────────────────────────────────────────
vi.mock("@/lib/redis", () => ({
  cacheGet: vi.fn().mockResolvedValue(null), // cache miss by default
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

// ── Mock Supabase ──────────────────────────────────────────────────────────
const mockProducts = [
  {
    id: "p1",
    name: "Nike Air Max",
    brand: "Nike",
    category: "Shoes",
    createdat: "2024-01-01",
    clothes: [{ count: 5 }],
  },
  {
    id: "p2",
    name: "Levi's 501",
    brand: "Levi's",
    category: "Bottoms",
    createdat: "2024-01-02",
    clothes: [{ count: 3 }],
  },
];

const mockQueryChain = {
  select: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
  not: vi.fn().mockResolvedValue({ data: [], error: null }),
};

const mockFrom = vi.fn().mockReturnValue(mockQueryChain);

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServer: () => ({ from: mockFrom }),
}));

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("https://example.com/api/catalogue");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

beforeEach(() => {
  vi.clearAllMocks();

  // Reset the query chain to resolve with products
  mockQueryChain.select.mockReturnThis();
  mockQueryChain.or.mockReturnThis();
  mockQueryChain.ilike.mockReturnThis();
  mockQueryChain.order.mockReturnThis();
  mockQueryChain.range.mockResolvedValue({
    data: mockProducts,
    error: null,
    count: 2,
  });
  mockQueryChain.limit.mockResolvedValue({ data: mockProducts, error: null });
  mockQueryChain.not.mockResolvedValue({ data: [], error: null });
  mockFrom.mockReturnValue(mockQueryChain);
});

describe("GET /api/catalogue", () => {
  it("returns a list of products with popularity counts", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.products).toBeInstanceOf(Array);
    expect(body.products[0]).not.toHaveProperty("clothes"); // should be stripped
    expect(body.products[0]).toHaveProperty("popularityCount");
  });

  it("returns X-Cache: MISS on first fetch", async () => {
    const res = await GET(makeRequest());
    expect(res.headers.get("X-Cache")).toBe("MISS");
  });

  it("returns X-Cache: HIT when cache is warm", async () => {
    const { cacheGet } = await import("@/lib/redis");
    vi.mocked(cacheGet).mockResolvedValueOnce({
      products: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    const res = await GET(makeRequest());
    expect(res.headers.get("X-Cache")).toBe("HIT");
  });

  it("includes total, limit, and offset in the response", async () => {
    const res = await GET(makeRequest({ limit: "10", offset: "20" }));
    const body = await res.json();
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("limit");
    expect(body).toHaveProperty("offset");
  });

  it("returns suggestions sorted by popularityCount when suggestions=true", async () => {
    const res = await GET(makeRequest({ q: "nike", suggestions: "true" }));
    const body = await res.json();
    expect(body.type).toBe("suggestions");
    expect(body.products.length).toBeLessThanOrEqual(10);
  });

  it("returns 500 when database throws", async () => {
    // Default sort is "popularity" which uses .limit(), not .range()
    mockQueryChain.limit.mockResolvedValueOnce({
      data: null,
      error: new Error("DB error"),
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
