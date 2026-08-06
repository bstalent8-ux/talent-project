// ─── Country / dial-code data ─────────────────────────────────────────────────
// Pure data + pure helpers. No React, no I/O — safe to import from both the
// client component and (if ever needed) a server route.
//
// Add a country by adding one line to COUNTRIES. Nothing else needs touching:
// the flag is derived from `iso`, search and localization both read the same
// row.

export interface Country {
  /** ISO 3166-1 alpha-2, e.g. "EG". Uppercase — flagEmoji() depends on that. */
  iso:      string;
  /** E.164 dial code, digits only, no "+". */
  dialCode: string;
  nameAr:   string;
  nameEn:   string;
}

// Arab countries only, per the current brief. The list is intentionally flat
// and ungrouped so adding a non-Arab country later is still just one line.
export const COUNTRIES: Country[] = [
  { iso: "EG", dialCode: "20",  nameAr: "مصر",         nameEn: "Egypt" },
  { iso: "SA", dialCode: "966", nameAr: "السعودية",     nameEn: "Saudi Arabia" },
  { iso: "AE", dialCode: "971", nameAr: "الإمارات",     nameEn: "UAE" },
  { iso: "KW", dialCode: "965", nameAr: "الكويت",       nameEn: "Kuwait" },
  { iso: "QA", dialCode: "974", nameAr: "قطر",          nameEn: "Qatar" },
  { iso: "BH", dialCode: "973", nameAr: "البحرين",      nameEn: "Bahrain" },
  { iso: "OM", dialCode: "968", nameAr: "عُمان",        nameEn: "Oman" },
  { iso: "JO", dialCode: "962", nameAr: "الأردن",       nameEn: "Jordan" },
  { iso: "LB", dialCode: "961", nameAr: "لبنان",        nameEn: "Lebanon" },
  { iso: "IQ", dialCode: "964", nameAr: "العراق",       nameEn: "Iraq" },
  { iso: "SY", dialCode: "963", nameAr: "سوريا",        nameEn: "Syria" },
  { iso: "PS", dialCode: "970", nameAr: "فلسطين",       nameEn: "Palestine" },
  { iso: "YE", dialCode: "967", nameAr: "اليمن",        nameEn: "Yemen" },
  { iso: "LY", dialCode: "218", nameAr: "ليبيا",        nameEn: "Libya" },
  { iso: "DZ", dialCode: "213", nameAr: "الجزائر",      nameEn: "Algeria" },
  { iso: "MA", dialCode: "212", nameAr: "المغرب",       nameEn: "Morocco" },
  { iso: "TN", dialCode: "216", nameAr: "تونس",         nameEn: "Tunisia" },
  { iso: "SD", dialCode: "249", nameAr: "السودان",      nameEn: "Sudan" },
  { iso: "MR", dialCode: "222", nameAr: "موريتانيا",    nameEn: "Mauritania" },
  { iso: "DJ", dialCode: "253", nameAr: "جيبوتي",       nameEn: "Djibouti" },
  { iso: "SO", dialCode: "252", nameAr: "الصومال",      nameEn: "Somalia" },
  { iso: "KM", dialCode: "269", nameAr: "جزر القمر",    nameEn: "Comoros" },
];

const DEFAULT_ISO = "SA";
const ARABIC_DEFAULT_ISO = "EG";

const BY_ISO: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.iso, c]));

export function findCountry(iso: string): Country {
  return BY_ISO[iso] ?? BY_ISO[DEFAULT_ISO];
}

/** Regional-indicator flag built from the ISO code — no per-country emoji to keep in sync. */
export function flagEmoji(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

/**
 * "Previous value if available, else Egypt for an Arabic browser, else Saudi
 * Arabia" — reads navigator/localStorage, so it must only ever run client-side
 * (see the useEffect in PhoneInput's callers; calling this during SSR/edge
 * render would just fall through every branch to the default, which is safe
 * but means the caller should re-run it after mount for the real browser
 * signal to take effect).
 */
export function detectDefaultCountryIso(): string {
  if (typeof window === "undefined") return DEFAULT_ISO;

  try {
    const remembered = window.localStorage.getItem(REMEMBERED_COUNTRY_KEY);
    if (remembered && BY_ISO[remembered]) return remembered;
  } catch {
    // localStorage can throw in locked-down contexts (private mode, iframes
    // with storage disabled) — falling through to language detection is fine.
  }

  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ar")) {
    return ARABIC_DEFAULT_ISO;
  }

  return DEFAULT_ISO;
}

export const REMEMBERED_COUNTRY_KEY = "talents_auth_phone_country";

export function rememberCountryIso(iso: string): void {
  try {
    window.localStorage.setItem(REMEMBERED_COUNTRY_KEY, iso);
  } catch {
    // Non-fatal — remembering the choice is a nicety, not a requirement.
  }
}

/**
 * Matches country name (both languages), ISO code, or dial code against a
 * free-text query. Arabic text is compared as-is (case has no meaning there);
 * Latin text and the query are both lower-cased. A leading "+" or spaces in
 * the query are stripped before the dial-code comparison so "+20" and "20"
 * both match.
 */
export function searchCountries(countries: Country[], rawQuery: string): Country[] {
  const query = rawQuery.trim();
  if (!query) return countries;

  const lower = query.toLowerCase();
  const digits = query.replace(/[^0-9]/g, "");

  return countries.filter((c) => {
    if (c.nameEn.toLowerCase().includes(lower)) return true;
    if (c.nameAr.includes(query)) return true;
    if (c.iso.toLowerCase().includes(lower)) return true;
    if (digits && c.dialCode.includes(digits)) return true;
    return false;
  });
}
