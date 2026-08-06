// ─── Shared client helpers for the profile-config admin screens ───────────────
// No state library, no data-fetching library — plain fetch + useState, matching
// AdminCategoriesClient.

export interface ZodIssue {
  path:    (string | number)[];
  message: string;
}

/**
 * Turns an API error body into one readable line.
 *
 * The profile-config routes return Zod failures as
 * `{ error: "Invalid input", issues: [...] }` and guard failures as
 * `{ error: "<message>" }` with a 409. Both are surfaced verbatim — the guard
 * messages are written to be shown to an admin.
 */
export function formatApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;

  const body = data as { error?: string; issues?: ZodIssue[] };

  if (Array.isArray(body.issues) && body.issues.length > 0) {
    const details = body.issues
      .map((issue) => {
        const path = issue.path.filter((p) => p !== "").join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join(" · ");
    return `${body.error ?? fallback} — ${details}`;
  }

  return body.error ?? fallback;
}

/** Sends JSON and throws a formatted Error on a non-2xx. */
export async function requestJson<T>(
  url: string,
  init: { method: string; body?: unknown },
  fallbackError: string,
): Promise<T> {
  const res = await fetch(url, {
    method: init.method,
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(formatApiError(data, fallbackError));
  return data as T;
}
