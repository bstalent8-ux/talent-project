// Shared branded frame for every transactional email — the 2026-09 palette
// (Vanilla Cream ground, cream card, Deep Teal wordmark, Muted Peach rule,
// Dark Chocolate text). Table-based with inline styles only, so it holds up
// in Gmail/Outlook. The wordmark is plain text on purpose: remote images are
// blocked by default in most clients, and the S-2 test suite asserts no
// template emits an <img> at all.

export const EMAIL_COLORS = {
  ground:  "#F5EEDB",
  card:    "#FBF7EA",
  border:  "#E6DCC3",
  text:    "#2B211D",
  muted:   "#6E5F55",
  teal:    "#087F83",
  peach:   "#E7A58A",
} as const;

const FOOTER = {
  ar: "Talents · منصة المواهب العربية",
  en: "Talents · The Arab world's talent platform",
};

/** Wraps a template's body HTML (already escaped by the caller) in the branded frame. */
export function emailLayout(lang: "ar" | "en", inner: string): string {
  const c = EMAIL_COLORS;
  const dir = lang === "ar" ? "rtl" : "ltr";
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.ground}; padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="${dir}" style="max-width:560px; background:${c.card}; border:1px solid ${c.border}; border-radius:16px;">
        <tr>
          <td style="padding:24px 28px 0; font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
            <div style="font-size:22px; font-weight:800; letter-spacing:0.5px; color:${c.teal};">TALENTS</div>
            <div style="width:44px; height:3px; background:${c.peach}; border-radius:2px; margin-top:8px;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 24px;">${inner}</td>
        </tr>
        <tr>
          <td style="padding:16px 28px; border-top:1px solid ${c.border}; font-family:'Segoe UI',Tahoma,Arial,sans-serif; font-size:12px; color:${c.muted};">
            ${FOOTER[lang]}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}
