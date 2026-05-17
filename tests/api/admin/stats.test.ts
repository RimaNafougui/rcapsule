import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/stats/route";

// ── Mocks ─────────────────────────────────────────────────────────────────
vi.mock("@/auth", () => ({ auth: vi.fn() }));

const mockLimit = vi.fn().mockResolvedValue({ success: true, reset: 0 });

vi.mock("@/lib/ratelimit", () => ({
  apiLimiter: vi.fn(() => ({ limit: mockLimit })),
  rateLimitResponse: vi.fn(
    () =>
      new Response(JSON.stringify({ error: "Too many requests." }), {
        status: 429,
      }),
  ),
}));

/**
 * Builds a chainable, thenable Supabase mock.
 * Chained methods return `this`; awaiting the chain resolves with `resolveWith`.
 * `.not()` and `.gte()` resolve directly as terminal methods.
 */
function makeChain(
  resolveWith: object = { count: 10, data: null, error: null },
) {
  const chain: any = {};
  const returnsThis = ["select", "eq", "order", "range", "limit"];

  returnsThis.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });

  chain.not = vi.fn().mockResolvedValue({ data: [], error: null });
  chain.gte = vi.fn().mockResolvedValue({ data: [], error: null });
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve(resolveWith).then(resolve, reject);

  return chain;
}

const mockFrom = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServer: () => ({ from: mockFrom }),
}));

const adminSession = {
  user: { id: "admin-1", role: "admin" },
  expires: "2099-01-01",
};

function makeRequest() {
  return new Request("https://example.com/api/admin/stats");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLimit.mockResolvedValue({ success: true, reset: 0 });
  mockFrom.mockReturnValue(makeChain());
});

// ── Tests ─────────────────────────────────────────────────────────────────
describe("GET /api/admin/stats", () => {
  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-1", role: "user" },
      expires: "2099-01-01",
    } as any);

    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limited", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);
    mockLimit.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 60_000,
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns 200 with stats shape on success", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("totalUsers");
    expect(body).toHaveProperty("totalItems");
    expect(body).toHaveProperty("catalogueSize");
    expect(body).toHaveProperty("pendingReports");
    expect(body).toHaveProperty("signupTrend");
    expect(body).toHaveProperty("topBrands");
    expect(body).toHaveProperty("itemsByCategory");
    expect(Array.isArray(body.signupTrend)).toBe(true);
    expect(Array.isArray(body.topBrands)).toBe(true);
    expect(Array.isArray(body.itemsByCategory)).toBe(true);
  });

  it("returns 500 when database throws", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    // Make the first from() call reject when awaited
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (_: any, reject: any) => reject(new Error("DB down")),
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
