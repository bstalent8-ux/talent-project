// ─── Category-aware talent layout ─────────────────────────────────────────
// PURE. No React, no I/O — does NOT touch profile_layouts. The stored layout
// (admin-configured, shared by every talent regardless of category) is the
// base; this only relocates sections at fixed anchor points, so UGC and
// Model get a different information hierarchy from the SAME single
// DynamicProfileRenderer path — not a second hardcoded profile system.
//
// Placement, Model only:
//   - Presence sits right after Portfolio (both ugc and model agree on this).
//   - Measurements ("physical") moves to the SIDEBAR, as a compact card —
//     it used to sit full-width in main right before Portfolio; too large
//     for what is 5 short stat rows. See MeasurementsSection.tsx.
//   - Brand Collaborations ("brands") moves out of the sidebar into main,
//     right after Experience/Previous Shoots — every other category still
//     gets it in the sidebar, unchanged.
//   - Experience and brands both go to width "half", so the flex-wrap main
//     column (DynamicSectionRenderer) sits them side by side as one row —
//     "Previous Shoots | Brand Collaborations" — instead of each stacking
//     full-width. Every other category's "experience" entry keeps whatever
//     width the stored layout gives it (full, today).
//
// Idempotent: any pre-existing "social"/"physical"/"brands" entry is dropped
// from wherever it currently sits and reinserted at the anchor, so calling
// this twice (or on a layout an admin later configures explicitly) never
// produces a duplicate or drifts order.
//
// Legacy/unknown categories (fashion, null, anything but "model") get
// Presence inserted the same way and NOTHING else touched — no bespoke
// section is invented for them, "physical" never appears at all, and
// "brands" stays exactly where the stored layout puts it (sidebar today).

import type { ProfileLayoutDTO } from "@/features/profiles/types/dto";
import type { LayoutEntry } from "@/features/profiles/content/layout-entries";

export function applyCategoryTalentLayout(
  layout: ProfileLayoutDTO,
  category: string | null | undefined,
): ProfileLayoutDTO {
  const isModel = category === "model";

  const main: LayoutEntry[] = layout.main.filter((entry) => {
    if (entry.key === "social" || entry.key === "physical") return false;
    if (isModel && entry.key === "brands") return false;
    return true;
  });

  const sidebar: LayoutEntry[] = layout.sidebar.filter((entry) => {
    if (isModel && entry.key === "physical") return false;
    if (isModel && entry.key === "brands") return false;
    return true;
  });

  if (isModel) {
    // Compact Measurements card leads the sidebar rail.
    sidebar.unshift({ key: "physical", width: "full" });
  }

  const experienceIdx = main.findIndex((entry) => entry.key === "experience");
  if (isModel) {
    if (experienceIdx >= 0) main[experienceIdx] = { key: "experience", width: "half" };
    // Brand Collaborations, right after Experience/Previous Shoots, same width
    // so the two sit in one row.
    main.splice(experienceIdx >= 0 ? experienceIdx + 1 : main.length, 0, { key: "brands", width: "half" });
  }

  const portfolioIdxAfter = main.findIndex((entry) => entry.key === "portfolio");
  main.splice(portfolioIdxAfter >= 0 ? portfolioIdxAfter + 1 : main.length, 0, { key: "social", width: "full" });

  return { ...layout, main, sidebar };
}
