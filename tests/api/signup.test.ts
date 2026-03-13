import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/signup/route";

// ── Mock rate limiter (always pass) ────────────────────────────────────────
vi.mock("@/lib/ratelimit", () => ({
  authLimiter: () => ({ limit: vi.fn().mockResolvedValue({ success: true, reset: 0 }) }),
  getIdentifier: vi.fn().mockReturnValue("ip:127.0.0.1"),
  rateLimitResponse: vi.fn(),
}));

// ── Supabase mock ─────────────────────────────────────────────────────────
const mockSignUp = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServer: () => ({
    from: mockFrom,
    auth: { signUp: mockSignUp },
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Returns a chainable Supabase query builder that resolves with {data, error} */
function makeChain(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {};
  const resolve = vi.fn().mockResolvedValue({ data, error });
  chain.select = vi.fn().mockReturnValue(chain);
  chain.ilike  = vi.fn().mockReturnValue(chain);
  chain.eq     = vi.fn().mockReturnValue(chain);
  chain.single = resolve;
  chain.insert = vi.fn().mockResolvedValue({ data, error });
  chain.update = vi.fn().mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://rcapsule.com");
});

describe("POST /api/auth/signup", () => {
  describe("input validation", () => {
    it("returns 400 when email is missing", async () => {
      const res = await POST(makeRequest({ password: "Passw0rd!", username: "testuser" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when password is missing", async () => {
      const res = await POST(makeRequest({ email: "test@test.com", username: "testuser" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when username is missing", async () => {
      const res = await POST(makeRequest({ email: "test@test.com", password: "Passw0rd!" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when username is too short (< 3 chars)", async () => {
      const res = await POST(makeRequest({ email: "test@test.com", password: "Passw0rd!", username: "ab" }));
      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toMatch(/3-30/);
    });

    it("returns 400 when username is too long (> 30 chars)", async () => {
      const res = await POST(makeRequest({ email: "test@test.com", password: "Passw0rd!", username: "a".repeat(31) }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when username contains invalid characters", async () => {
      const res = await POST(makeRequest({ email: "test@test.com", password: "Passw0rd!", username: "bad user!" }));
      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toMatch(/letters, numbers/);
    });

    it("returns 400 when username starts with a dash", async () => {
      const res = await POST(makeRequest({ email: "test@test.com", password: "Passw0rd!", username: "-badstart" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when username ends with an underscore", async () => {
      const res = await POST(makeRequest({ email: "test@test.com", password: "Passw0rd!", username: "badend_" }));
      expect(res.status).toBe(400);
    });
  });

  describe("business logic", () => {
    it("returns 400 when username is already taken", async () => {
      // Username check — user exists
      mockFrom.mockReturnValue(makeChain({ id: "existing-id" }));

      const res = await POST(makeRequest({ email: "test@test.com", password: "Passw0rd!", username: "takenuser" }));
      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toMatch(/already taken/i);
    });

    it("returns 400 when Supabase auth.signUp returns an error", async () => {
      // Username check — not taken
      mockFrom.mockReturnValue(makeChain(null, { code: "PGRST116" }));
      mockSignUp.mockResolvedValue({ data: { user: null }, error: { message: "Email already registered" } });

      const res = await POST(makeRequest({ email: "taken@test.com", password: "Passw0rd!", username: "newuser" }));
      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("Email already registered");
    });

    it("returns 201 on successful signup", async () => {
      // First call: username check (not taken)
      // Second call: user record select (found — trigger created it)
      // Third call: update to patch in username
      mockFrom
        .mockReturnValueOnce(makeChain(null, { code: "PGRST116" }))   // username ilike check
        .mockReturnValueOnce(makeChain({ id: "new-id" }))              // existingRecord select
        .mockReturnValueOnce(makeChain(null));                          // update username

      mockSignUp.mockResolvedValue({
        data: { user: { id: "new-id", email: "test@test.com" } },
        error: null,
      });

      const res = await POST(makeRequest({ email: "test@test.com", password: "Passw0rd!", username: "newuser" }));
      expect(res.status).toBe(201);
      const body = await res.json() as { user: { username: string; email: string } };
      expect(body.user.username).toBe("newuser");
      expect(body.user.email).toBe("test@test.com");
    });
  });
});
