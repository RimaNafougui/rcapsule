/**
 * Narrows an unknown catch value to a readable message string.
 * Handles Error instances, plain strings, and objects with a message property
 * (e.g. Supabase PostgrestError).
 * Replaces the unsafe `catch (err: any)` pattern throughout the codebase.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (
    err !== null &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as Record<string, unknown>).message === "string"
  ) {
    return (err as Record<string, unknown>).message as string;
  }

  return "An unexpected error occurred";
}
