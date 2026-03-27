import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/clothes/route";
import { DELETE } from "@/app/api/clothes/[id]/route";

// ── Mocks ─────────────────────────────────────────────────────────────────
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({
  startSpan: vi.fn((_opts: unknown, fn: (span: null) => unknown) => fn(null)),
  captureException: vi.fn(),
}));

const mockDbChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn(),
};
const mockFrom = vi.fn().mockReturnValue(mockDbChain);

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServer: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/redis", () => ({
  cacheDel: vi.fn().mockResolvedValue(undefined),
  analyticsKey: vi.fn((id: string) => `analytics:v1:${id}`),
  ownedClothesKey: vi.fn((id: string) => `clothes:owned:v1:${id}`),
}));

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options);
}

beforeEach(async () => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(mockDbChain);
  mockDbChain.select.mockReturnThis();
  mockDbChain.eq.mockReturnThis();
  mockDbChain.or.mockReturnThis();
  mockDbChain.order.mockReturnThis();
  mockDbChain.range.mockReturnThis();
  mockDbChain.insert.mockReturnThis();
  mockDbChain.update.mockReturnThis();
  mockDbChain.delete.mockReturnThis();
  mockDbChain.in.mockReturnThis();

  const { auth } = await import("@/auth");
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-abc", email: "user@test.com", name: "User" },
    expires: "2099-01-01",
  } as Awaited<ReturnType<typeof auth>>);
});

describe("GET /api/clothes", () => {
  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await GET(makeRequest("https://example.com/api/clothes"));
    expect(res.status).toBe(401);
  });

  it("returns a list of clothes for the authenticated user", async () => {
    const mockClothes = [
      { id: "c1", name: "T-Shirt", category: "Tops", userId: "user-abc" },
      { id: "c2", name: "Jeans", category: "Bottoms", userId: "user-abc" },
    ];
    mockDbChain.order.mockReturnThis();
    mockDbChain.range = vi.fn().mockResolvedValue({ data: mockClothes, error: null });

    const res = await GET(makeRequest("https://example.com/api/clothes"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("returns 500 when database throws", async () => {
    mockDbChain.order.mockReturnThis();
    mockDbChain.range = vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") });

    const res = await GET(makeRequest("https://example.com/api/clothes"));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/clothes", () => {
  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await POST(
      makeRequest("https://example.com/api/clothes", {
        method: "POST",
        body: JSON.stringify({ name: "T-Shirt", category: "Tops" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(
      makeRequest("https://example.com/api/clothes", {
        method: "POST",
        body: JSON.stringify({ category: "Tops" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when category is missing", async () => {
    const res = await POST(
      makeRequest("https://example.com/api/clothes", {
        method: "POST",
        body: JSON.stringify({ name: "T-Shirt" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 201 with the created item on success", async () => {
    const createdClothes = { id: "new-id", name: "T-Shirt", category: "Tops", userId: "user-abc" };
    mockDbChain.single.mockResolvedValue({ data: createdClothes, error: null });

    const res = await POST(
      makeRequest("https://example.com/api/clothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "T-Shirt", category: "Tops" }),
      }),
    );
    expect(res.status).toBe(201);
  });
});

describe("DELETE /api/clothes/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await DELETE(
      makeRequest("https://example.com/api/clothes/c1"),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful deletion", async () => {
    mockDbChain.select = vi.fn().mockResolvedValue({
      data: [{ id: "c1", userId: "user-abc" }],
      error: null,
    });

    const res = await DELETE(
      makeRequest("https://example.com/api/clothes/c1"),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("returns 404 when item does not belong to the user", async () => {
    mockDbChain.select = vi.fn().mockResolvedValue({ data: [], error: null });

    const res = await DELETE(
      makeRequest("https://example.com/api/clothes/c1"),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(404);
  });
});
