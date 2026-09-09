// ─── Bio phone-number detection — pure, unit-tested ─────────────────────────
// Backs the /admin dashboard's "phone numbers in bio" alert card. Talents
// writing a direct phone number into their bio is a policy problem (it lets
// a brand contact them outside the platform's own chat/booking flow,
// bypassing the pipeline this app is built around — see CLAUDE.md §10.1) —
// this flags it for review, it doesn't remove or block anything itself.
//
// Deliberately generic rather than Egypt-only (01[0125]xxxxxxxx): a run of
// 9-15 digit characters, loosely separated by spaces/dashes/dots, catches
// "01012345678", "+20 100 123 4567", and "010-1234-5678" alike without
// hardcoding one country's numbering plan. Kept separate from admin.
// service.ts so this logic is testable without mocking Supabase.

export interface PhoneMatch {
  /** The exact substring matched, as written in the bio (for display). */
  raw: string;
  /** Digits only — used for de-duplication. */
  digits: string;
}

const CANDIDATE_REGEX = /\+?\d[\d\-\s.]{7,}\d/g;
const MIN_DIGITS = 9;
const MAX_DIGITS = 15;

export function extractPhoneCandidates(text: string | null | undefined): PhoneMatch[] {
  if (!text) return [];
  const found = text.match(CANDIDATE_REGEX) ?? [];

  const seen = new Set<string>();
  const results: PhoneMatch[] = [];
  for (const raw of found) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) continue;
    if (seen.has(digits)) continue;
    seen.add(digits);
    results.push({ raw: raw.trim(), digits });
  }
  return results;
}

export function bioContainsPhoneNumber(text: string | null | undefined): boolean {
  return extractPhoneCandidates(text).length > 0;
}
