/**
 * Package prices live in `talent_profiles.packages` as free text and are
 * entered in Arabic-Indic digits as often as ASCII ones ("٢٢٠٠"). JS `\d`
 * matches ASCII only, so stripping non-digits first turns every Arabic-Indic
 * price into 0 — the talent then has no parseable price and drops out of
 * Explore behind the max-price filter.
 *
 * Returns 0 when nothing numeric can be read, so callers can filter with
 * `> 0` before taking a minimum.
 */
export function parsePrice(value: unknown): number {
  const ascii = String(value ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
  return parseInt(ascii.replace(/[^\d]/g, ""), 10) || 0;
}
