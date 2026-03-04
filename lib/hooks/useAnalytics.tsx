// hooks/useAnalytics.ts
import type { Analytics } from "@/lib/types/analytics";

import useSWR from "swr";

import { apiFetch } from "@/types/api-response";

/**
 * SWR fetcher that returns ApiResponse<Analytics>.
 *
 * WHY: Previously `fetcher` returned `any` and callers could accidentally
 * access `.overview` on an error body. Now `analytics` is typed as
 * `Analytics | undefined` — the `ApiResponse` union forces the check at the
 * call site, and the `data` field is only accessible after narrowing `ok`.
 */
const fetcher = (url: string) =>
  apiFetch<Analytics>(url).then((result) => {
    // SWR needs a thrown error to set its own `error` state.
    if (!result.ok) throw new Error(result.error);

    return result.data;
  });

export function useAnalytics() {
  const { data, error, mutate } = useSWR<Analytics>("/api/analytics", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 minute
  });

  return {
    analytics: data,
    isLoading: !error && !data,
    isError: error as Error | undefined,
    refresh: mutate,
  };
}
