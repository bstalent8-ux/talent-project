// ─── talent_profiles.availability vocabulary ────────────────────────────────
// The app speaks "available" | "unavailable", but the live column only accepts
// "available" | "busy" (a CHECK constraint with no migration in this repo — the
// database is the source of truth, CLAUDE.md §6). Writing "unavailable" made
// every "I'm not available" save fail with a generic 500. Translate at the DB
// boundary so the rest of the app keeps one vocabulary. Pure, importable from
// server and client.

/** App value → value the column accepts. */
export function toDbAvailability<T>(value: T): T | "busy" {
  return value === "unavailable" ? "busy" : value;
}

/** Column value → app value ("busy" and any legacy non-available value read as unavailable). */
export function fromDbAvailability(value: string | null | undefined): string {
  if (!value) return "available";
  return value === "available" ? "available" : "unavailable";
}
