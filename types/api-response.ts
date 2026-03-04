/**
 * Discriminated union for all client-side API call results.
 *
 * WHY: The previous pattern returned `T | null` or `{ data, error }` dual
 * fields, both of which require the caller to perform null/error checks that
 * the type system cannot enforce. With a discriminated union, exhaustive
 * narrowing is enforced at compile time: you *must* check `result.ok` before
 * touching `result.data`, and the compiler won't let you access `.data` on a
 * failure branch.
 *
 * DISCRIMINANT: `ok: true | false` is the narrowing key. TypeScript's control
 * flow analysis narrows the entire type inside an `if (result.ok)` block, so
 * `result.data` is only visible on the success branch.
 */

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: string;
  /** HTTP status code, when available. */
  status?: number;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// ─── Typed fetch utility ─────────────────────────────────────────────────────
//
// A single wrapper so every caller gets a properly-typed ApiResponse<T>
// instead of raw `fetch` + manual `.ok` checks scattered across files.

export async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    // `res.json()` is untyped; we trust the server shape matches T here.
    // Validation with Zod at the boundary is the next layer of safety.
    const body = (await res.json()) as T | { error: string };

    if (!res.ok) {
      const errorMsg =
        body !== null && typeof body === "object" && "error" in body
          ? (body as { error: string }).error
          : `HTTP ${res.status}`;

      return { ok: false, error: errorMsg, status: res.status };
    }

    return { ok: true, data: body as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
