// ─── Section anchors ──────────────────────────────────────────────────────────
// PURE. No React.
//
// TabsNavigation scrolls to fixed element ids (section-about, section-portfolio,
// section-experience, section-packages, section-usage). Most section keys map
// straight to `section-{key}`, but two do not — those aliases exist so the
// dynamic renderer keeps the EXACT anchor contract TalentModelProfile has today.
//
// Getting this wrong silently breaks the tab bar, so it is aliased explicitly
// and covered by tests rather than left to convention.

/** sectionKey → anchor id, where the anchor differs from `section-{key}`. */
export const SECTION_ANCHOR_ALIASES: Record<string, string> = {
  // TalentModelProfile.tsx:101 — <div id="section-usage"><UsageRightsSection …>
  usage_addons: "section-usage",
  // TalentModelProfile.tsx:97 — <div id="section-about" /> is the bio target
  bio:          "section-about",
};

/** The anchor ids TabsNavigation currently targets. Used by the tests. */
export const KNOWN_TAB_ANCHORS = [
  "section-about",
  "section-portfolio",
  "section-experience",
  "section-packages",
  "section-usage",
] as const;

export function anchorIdFor(sectionKey: string): string {
  return SECTION_ANCHOR_ALIASES[sectionKey] ?? `section-${sectionKey}`;
}
