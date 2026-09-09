// ─── Public handle derivation ────────────────────────────────────────────
// `profiles.handle` is the slug used in public URLs — /talent/[handle],
// /model/[handle], /ugc/[handle] (and /brand/[id] accepts one as a
// fallback) — so it should read as an identity, not leak the account's
// email, and never come out as a bare number (that reads as a database id,
// not a name — see the /model/2102622 report this fixes).
//
// Falls back name → email local-part → a placeholder, in that order: a lot
// of full names here are Arabic script, which slugify() strips to nothing
// (no transliteration — that's a real, separate feature, not this fix), so
// the email local-part is still the most common source in practice. Used
// at signup (app/(auth)/register/page.tsx) — never retroactively rewrites
// an existing handle, since /talent/<handle> links may already be shared.

// Exported too — reused by features/blog for article slugs (a URL slug is a
// URL slug; no reason to duplicate this logic there).
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** At least one letter in it — a bare number (or nothing) isn't a name. */
function looksLikeAName(slug: string): boolean {
  return /[a-z]/.test(slug);
}

export function deriveHandle(fullName: string | null | undefined, email: string): string {
  const fromName = slugify(fullName ?? "");
  if (looksLikeAName(fromName)) return fromName;

  const fromEmail = slugify(email.split("@")[0] ?? "");
  if (looksLikeAName(fromEmail)) return fromEmail;

  // Neither source has a single Latin letter (Arabic-only name + a numeric
  // email local-part, e.g. a student/national ID address) — prefix rather
  // than publish a bare number.
  const digits = fromEmail || fromName || Date.now().toString(36);
  return `user-${digits}`;
}
