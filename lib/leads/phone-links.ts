// ─── Lead phone action links (SHARED — no server imports) ───────────────────
// Turns a lead's stored phone (normalizePhone() output — leading zeros
// stripped, "+" kept only if the source already had one) into a WhatsApp
// deep link and a dialable international number. Egyptian market default
// (see CLAUDE.md §1 "Egyptian/Arab market"): a bare local number with no
// country code is assumed Egyptian and gets "20" prepended.

const DEFAULT_COUNTRY_CODE = "20";

/** Digits only, country-code-prefixed, no leading "+" — what wa.me expects.
 *  Exported so callers that need to compare phone numbers for equality
 *  (e.g. the talents duplicate-detection scan) normalize the same way. */
export function toIntlDigits(phone: string): string {
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  } else if (!digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    digits = DEFAULT_COUNTRY_CODE + digits;
  }
  return digits;
}

export function toWhatsAppLink(phone: string, message?: string): string {
  const base = `https://wa.me/${toIntlDigits(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** For a `tel:` href — dialers want the "+" back. */
export function toTelLink(phone: string): string {
  return `tel:+${toIntlDigits(phone)}`;
}

/** Same number, formatted for display in the "no dialer" fallback popup. */
export function toDisplayPhone(phone: string): string {
  return `+${toIntlDigits(phone)}`;
}
