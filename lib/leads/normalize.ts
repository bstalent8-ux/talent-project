// ─── Lead identity normalization ────────────────────────────────────────────
// Pure functions, no DB access — shared by the service layer (matching) and
// the import column-mapping heuristic. Kept deliberately loose: the whole
// point of this CRM is accepting messy data, so normalization only strips
// obvious formatting noise, never rejects a value.

/** Lowercased + trimmed. Empty string collapses to null so a blank cell
 *  from an Excel import never counts as "has an email". */
export function normalizeEmail(value: string | null | undefined): string | null {
  const v = value?.trim().toLowerCase();
  return v ? v : null;
}

/** Keeps only digits (and a leading +), so "010-1234 5678", "+20 10 1234
 *  5678" and "01012345678" all compare equal regardless of how someone
 *  typed it in. */
export function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.trim().replace(/(?!^\+)[^\d]/g, "");
  return digits.replace(/^\+?0*/, (m) => (m.startsWith("+") ? "+" : "")) || null;
}

/** Strips a leading "@" and lowercases, so "@Foo" and "foo" match. */
export function normalizeHandle(value: string | null | undefined): string | null {
  const v = value?.trim().replace(/^@/, "").toLowerCase();
  return v ? v : null;
}

/** Trims and collapses a blank string to null. */
export function normalizeText(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}
