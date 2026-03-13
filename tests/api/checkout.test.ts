import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── vi.hoisted ensures this runs before vi.mock hoisting ─────────────────
const stripeMocks = vi.hoisted(() => ({ createSession: vi.fn() }));

vi.mock("stripe", () => {
  // Must be a regular function (not arrow) so `new Stripe()` works correctly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function FakeStripe(this: any) {
    this.checkout = { sessions: { create: stripeMocks.createSession } };
  }
  class StripeError extends Error {}
  (FakeStripe as any).errors = { StripeError };
  return { default: FakeStripe };
});

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { POST } from "@/app/api/checkout/route";

// POST handler expects NextRequest so that request.nextUrl.origin is available
function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest("https://rcapsule.com/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  stripeMocks.createSession.mockReset();
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
  vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_monthly_fake");
  vi.stubEnv("STRIPE_PRICE_YEARLY", "price_yearly_fake");

  const { auth } = await import("@/auth");
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-123", email: "test@test.com", name: "Test" },
    expires: "2099-01-01",
  } as Awaited<ReturnType<typeof auth>>);
});

describe("POST /api/checkout", () => {
  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ billingCycle: "monthly" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid billing cycle", async () => {
    const res = await POST(makeRequest({ billingCycle: "weekly" }));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/invalid billing cycle/i);
  });

  it("returns a Stripe checkout URL for monthly billing", async () => {
    stripeMocks.createSession.mockResolvedValue({ url: "https://checkout.stripe.com/pay/cs_test_123" });
    const res = await POST(makeRequest({ billingCycle: "monthly" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { url: string };
    expect(body.url).toContain("stripe.com");
  });

  it("returns a Stripe checkout URL for yearly billing", async () => {
    stripeMocks.createSession.mockResolvedValue({ url: "https://checkout.stripe.com/pay/cs_test_456" });
    const res = await POST(makeRequest({ billingCycle: "yearly" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { url: string };
    expect(body.url).toBeTruthy();
  });

  it("passes userId in Stripe session metadata", async () => {
    stripeMocks.createSession.mockResolvedValue({ url: "https://checkout.stripe.com/pay/test" });
    await POST(makeRequest({ billingCycle: "monthly" }));
    expect(stripeMocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { userId: "user-123" } }),
    );
  });

  it("returns 500 when Stripe throws", async () => {
    stripeMocks.createSession.mockRejectedValueOnce(new Error("Stripe API error"));
    const res = await POST(makeRequest({ billingCycle: "monthly" }));
    expect(res.status).toBe(500);
  });
});
