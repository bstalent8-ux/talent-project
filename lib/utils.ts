import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_ARABIC_INDIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Parses a price string that may contain Arabic-Indic or Eastern
 * Arabic-Indic digit characters (real Unicode codepoints, not just a font's
 * visual glyph substitution of ASCII digits) — `parseInt`/`\d` silently
 * fail on those and would resolve to NaN/0. Seeded/admin-entered price
 * strings in this project can be in either script.
 */
export function parsePrice(price: string): number {
  const ascii = price.replace(/[٠-٩۰-۹]/g, (ch) => {
    const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(ch);
    if (arabicIndex !== -1) return String(arabicIndex);
    return String(EASTERN_ARABIC_INDIC_DIGITS.indexOf(ch));
  });
  return parseInt(ascii.replace(/[^\d]/g, ""), 10) || 0;
}
