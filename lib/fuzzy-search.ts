// Typo-tolerant text matching for client-side search over small in-memory
// lists (Explore, Jobs, Blog, Brands — see those *Client.tsx files). These
// pages already fetch their full dataset once and filter in the browser, so
// fuzzy matching happens here in JS rather than in Postgres. The DB-backed
// searches (admin lists, community — server-paginated, can't load
// everything client-side) get pg_trgm instead; that's a separate migration.
//
// Arabic-aware: a single wrong letter or dropped diacritic used to fail a
// plain .includes() search entirely, since alef/ة/ى have multiple visually-
// interchangeable forms that people type inconsistently.

const ARABIC_DIACRITICS = /[ً-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim()
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[b.length];
}

// Typo budget scales with word length — a 3-letter word needs an exact (or
// prefix) match, an 8+ letter word can absorb a couple of wrong/missing
// letters and still count.
function typoBudget(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 8) return 2;
  return 3;
}

/** 0 = no match, higher = closer. Exact substring always outranks fuzzy-only. */
export function matchScore(query: string, text: string): number {
  const q = normalizeText(query);
  const t = normalizeText(text);
  if (!q) return 0;
  if (t.includes(q)) return 100;

  // Every query word must find a match somewhere in the text (AND across
  // words), but each word tolerates its own typo budget.
  const qWords = q.split(" ").filter(Boolean);
  const tWords = t.split(" ").filter(Boolean);
  let total = 0;
  for (const qw of qWords) {
    let best = 0;
    for (const tw of tWords) {
      if (tw.includes(qw) || qw.includes(tw)) { best = Math.max(best, 60); continue; }
      const dist = levenshtein(qw, tw);
      const budget = typoBudget(Math.max(qw.length, tw.length));
      if (dist <= budget) best = Math.max(best, 50 - dist * 10);
    }
    if (best === 0) return 0;
    total += best;
  }
  return total / qWords.length;
}

/** Joins every field into one haystack so a multi-word query can match
 *  across fields (e.g. a job title word + a brand-name word). */
export function fuzzyMatch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.trim();
  if (!q) return true;
  return matchScore(q, fields.filter(Boolean).join(" ")) > 0;
}
