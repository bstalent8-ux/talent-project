// ─── Layout entry shape ────────────────────────────────────────────────────────
// A `profile_layouts.layout.main`/`.sidebar` array element is EITHER a plain
// section-key string (legacy — every layout written before this file existed)
// OR a `{ key, width }` object. Both are accepted forever; nothing rewrites a
// string entry into an object at rest.
//
// DELIBERATELY NOT `server-only`: the admin layout editor (client) and the
// public renderer (client) both need to read/build this shape, matching the
// section-content.ts precedent — one pure module, no I/O, both sides import it.
//
// Width is a closed enum, not free text: this is a layout composition
// primitive, not a CSS escape hatch. "Do not allow arbitrary CSS/HTML" is
// enforced by construction — there is no field an admin can put raw CSS into.

export const LAYOUT_WIDTHS = ["full", "half", "third", "two_thirds"] as const;
export type LayoutWidth = (typeof LAYOUT_WIDTHS)[number];

export interface LayoutEntry {
  key:   string;
  width: LayoutWidth;
}

function isLayoutWidth(value: unknown): value is LayoutWidth {
  return typeof value === "string" && (LAYOUT_WIDTHS as readonly string[]).includes(value);
}

/** One raw array element → a normalized entry, or null if it's unusable. */
export function normalizeLayoutEntry(raw: unknown): LayoutEntry | null {
  if (typeof raw === "string") {
    return raw.length > 0 ? { key: raw, width: "full" } : null;
  }

  if (raw && typeof raw === "object" && "key" in raw) {
    const obj = raw as Record<string, unknown>;
    const key = typeof obj.key === "string" ? obj.key : String(obj.key ?? "");
    if (!key) return null;
    return { key, width: isLayoutWidth(obj.width) ? obj.width : "full" };
  }

  return null;
}

/** A raw `main`/`sidebar` array (unknown shape, possibly mixed legacy+new) → entries. */
export function normalizeLayoutArray(raw: unknown): LayoutEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeLayoutEntry)
    .filter((entry): entry is LayoutEntry => entry !== null);
}

/** Inverse of normalizeLayoutEntry — full-width entries persist as a plain string,
 *  keeping a layout nobody has ever widened byte-identical to before this file
 *  existed. Only an entry with a non-full width is stored as an object. */
export function serializeLayoutEntry(entry: LayoutEntry): string | LayoutEntry {
  return entry.width === "full" ? entry.key : entry;
}

export function serializeLayoutArray(entries: LayoutEntry[]): Array<string | LayoutEntry> {
  return entries.map(serializeLayoutEntry);
}
