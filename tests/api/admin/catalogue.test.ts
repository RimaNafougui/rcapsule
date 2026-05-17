import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/admin/catalogue/route";
import {
  GET as getById,
  PATCH,
  DELETE,
} from "@/app/api/admin/catalogue/[id]/route";

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

function makeChain(
  resolveWith: object = { data: null, error: null, count: null },
) {
  const chain: any = {};
  const returnsThis = [
    "select",
    "eq",
    "or",
    "order",
    "range",
    "update",
    "delete",
    "insert",
    "not",
    "limit",
  ];

  returnsThis.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });

  chain.single = vi.fn().mockResolvedValue(resolveWith);
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve(resolveWith).then(resolve, reject);

  return chain;
}

let mockDbChain: ReturnType<typeof makeChain>;
const mockFrom = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServer: () => ({ from: mockFrom }),
}));

const adminSession = {
  user: { id: "admin-1", role: "admin" },
  expires: "2099-01-01",
};

const mockProduct = {
  id: "p1",
  name: "Test Shirt",
  brand: "TestBrand",
  category: "Tops",
  inStock: true,
  currency: "CAD",
};

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLimit.mockResolvedValue({ success: true, reset: 0 });
  mockDbChain = makeChain({ data: null, error: null, count: 0 });
  mockFrom.mockReturnValue(mockDbChain);
});

// ── GET /api/admin/catalogue ─────────────────────────────────────────────────
describe("GET /api/admin/catalogue", () => {
  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await GET(makeRequest("https://example.com/api/admin/catalogue"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "u1", role: "user" },
      expires: "2099-01-01",
    } as any);

    const res = await GET(makeRequest("https://example.com/api/admin/catalogue"));
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limited", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);
    mockLimit.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 60_000,
    });

    const res = await GET(makeRequest("https://example.com/api/admin/catalogue"));
    expect(res.status).toBe(429);
  });

  it("returns 200 with products list on success", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    // Resolve the thenable chain with product data
    mockDbChain.then = (resolve: any, reject: any) =>
      Promise.resolve({ data: [mockProduct], error: null, count: 1 }).then(
        resolve,
        reject,
      );

    const res = await GET(makeRequest("https://example.com/api/admin/catalogue"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("products");
    expect(body).toHaveProperty("total");
    expect(Array.isArray(body.products)).toBe(true);
  });

  it("supports search and filter query params", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    // Default chain resolves with empty data → 200 with empty products
    const res = await GET(
      makeRequest(
        "https://example.com/api/admin/catalogue?search=shirt&category=Tops&brand=Nike",
      ),
    );
    expect(res.status).toBe(200);
    expect(mockDbChain.or).toHaveBeenCalled();
    expect(mockDbChain.eq).toHaveBeenCalled();
  });

  it("returns 500 when database throws", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    // Resolve with a truthy error → route does `if (error) throw error`
    mockDbChain.then = (resolve: any, reject: any) =>
      Promise.resolve({
        data: null,
        error: { message: "DB fail" },
        count: null,
      }).then(resolve, reject);

    const res = await GET(makeRequest("https://example.com/api/admin/catalogue"));
    expect(res.status).toBe(500);
  });
});

// ── POST /api/admin/catalogue ────────────────────────────────────────────────
describe("POST /api/admin/catalogue", () => {
  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await POST(
      makeRequest("https://example.com/api/admin/catalogue", {
        method: "POST",
        body: JSON.stringify({
          name: "Shirt",
          brand: "Brand",
          category: "Tops",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    const res = await POST(
      makeRequest("https://example.com/api/admin/catalogue", {
        method: "POST",
        body: JSON.stringify({ name: "Shirt" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 201 with created product on success", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    mockDbChain.single = vi
      .fn()
      .mockResolvedValue({ data: mockProduct, error: null });

    const res = await POST(
      makeRequest("https://example.com/api/admin/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Shirt",
          brand: "TestBrand",
          category: "Tops",
        }),
      }),
    );
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.name).toBe("Test Shirt");
  });

  it("returns 500 when database throws", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    mockDbChain.single = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error("DB fail") });

    const res = await POST(
      makeRequest("https://example.com/api/admin/catalogue", {
        method: "POST",
        body: JSON.stringify({
          name: "Shirt",
          brand: "Brand",
          category: "Tops",
        }),
      }),
    );
    expect(res.status).toBe(500);
  });
});

// ── GET /api/admin/catalogue/[id] ────────────────────────────────────────────
describe("GET /api/admin/catalogue/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await getById(
      makeRequest("https://example.com/api/admin/catalogue/p1"),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when product is not found", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    mockDbChain.single = vi.fn().mockResolvedValue({ data: null, error: null });

    const res = await getById(
      makeRequest("https://example.com/api/admin/catalogue/p1"),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(404);
  });

  it("returns 200 with product data on success", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    mockDbChain.single = vi
      .fn()
      .mockResolvedValue({ data: mockProduct, error: null });

    const res = await getById(
      makeRequest("https://example.com/api/admin/catalogue/p1"),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.id).toBe("p1");
  });
});

// ── PATCH /api/admin/catalogue/[id] ─────────────────────────────────────────
describe("PATCH /api/admin/catalogue/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await PATCH(
      makeRequest("https://example.com/api/admin/catalogue/p1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      }),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when no valid fields are provided", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    const res = await PATCH(
      makeRequest("https://example.com/api/admin/catalogue/p1", {
        method: "PATCH",
        body: JSON.stringify({ unknownField: "value" }),
      }),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with updated product on success", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    const updated = { ...mockProduct, name: "Updated Shirt" };
    mockDbChain.single = vi
      .fn()
      .mockResolvedValue({ data: updated, error: null });

    const res = await PATCH(
      makeRequest("https://example.com/api/admin/catalogue/p1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated Shirt" }),
      }),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.name).toBe("Updated Shirt");
  });
});

// ── DELETE /api/admin/catalogue/[id] ────────────────────────────────────────
describe("DELETE /api/admin/catalogue/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await DELETE(
      makeRequest("https://example.com/api/admin/catalogue/p1"),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful deletion", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);

    mockDbChain.then = (resolve: any, reject: any) =>
      Promise.resolve({ error: null }).then(resolve, reject);

    const res = await DELETE(
      makeRequest("https://example.com/api/admin/catalogue/p1"),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 429 when rate limited", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(adminSession as any);
    mockLimit.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 60_000,
    });

    const res = await DELETE(
      makeRequest("https://example.com/api/admin/catalogue/p1"),
      { params: Promise.resolve({ id: "p1" }) },
    );
    expect(res.status).toBe(429);
  });
});
