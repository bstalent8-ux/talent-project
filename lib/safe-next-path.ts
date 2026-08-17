/**
 * Reads `?next=` from the current URL and returns it only if it's a safe
 * same-origin relative path — never absolute or protocol-relative — so
 * using it as a post-auth redirect can't become an open redirect.
 *
 * Shared by login/page.tsx and register/page.tsx. `next` is the same
 * convention middleware.ts already sets when it redirects a guest away
 * from a protected route, and GuestGuard.tsx's auth-modal buttons set too
 * (optionally with `&resume=<action>` appended, which just rides along as
 * part of the path since it's part of the querystring).
 */
export function safeNextPath(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
