// ─── Category-aware talent layout ─────────────────────────────────────────
// PURE. No React, no I/O — does NOT touch profile_layouts. The stored layout
// (admin-configured, shared by every talent regardless of category) is the
// base; this only relocates sections at fixed anchor points, so UGC and
// Model get a different information hierarchy from the SAME single
// DynamicProfileRenderer path — not a second hardcoded profile system.
//
// Placement, every category (not model-specific):
//   - Presence ("social") is a compact sidebar card, not a main-content
//     section — moved out of main and into the sidebar, positioned right
//     before Trust (the generic "trust" TrustCard, present for every
//     category) when Trust is part of the sidebar at all.
//
// Placement, Model only:
//   - Measurements ("physical") is dropped from BOTH main and sidebar. It
//     used to lead the sidebar as a compact card; now ProfileHero renders
//     the same 5 fields (via TalentData.measurements, itself built from
//     toMeasurements()) directly inside the Model hero, so keeping the
//     "physical" layout section too would show the same data twice. Nothing
//     else changes about the section: MeasurementsSection.tsx and the
//     "physical" adapter case still exist for a profile_layouts row that
//     configures it explicitly — this function just never re-adds it for
//     model anymore.
//   - Brand Collaborations ("brands") moves out of the sidebar into main,
//     right after Experience/Previous Shoots — every other category still
//     gets it in the sidebar, unchanged.
//   - Experience and brands both go to width "half", so the flex-wrap main
//     column (DynamicSectionRenderer) sits them side by side as one row —
//     "Previous Shoots | Brand Collaborations" — instead of each stacking
//     full-width. Every other category's "experience" entry keeps whatever
//     width the stored layout gives it (full, today).
//   - Reviews moves out of the sidebar into main, right after Packages, so
//     it reads as a full-width closing block instead of a narrow one-at-a-
//     time sidebar carousel. Every other category keeps it in the sidebar.
//
// Idempotent: any pre-existing "social"/"physical"/"brands"/"reviews" entry
// is dropped from wherever it currently sits and reinserted at the anchor,
// so calling this twice (or on a layout an admin later configures
// explicitly) never produces a duplicate or drifts order.
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
    if (isModel && (entry.key === "brands" || entry.key === "reviews")) return false;
    return true;
  });

  const sidebar: LayoutEntry[] = layout.sidebar.filter((entry) => {
    if (entry.key === "social") return false;
    if (isModel && entry.key === "physical") return false;
    if (isModel && (entry.key === "brands" || entry.key === "reviews")) return false;
    return true;
  });

  const experienceIdx = main.findIndex((entry) => entry.key === "experience");
  if (isModel) {
    if (experienceIdx >= 0) main[experienceIdx] = { key: "experience", width: "half" };
    // Brand Collaborations, right after Experience/Previous Shoots, same width
    // so the two sit in one row.
    main.splice(experienceIdx >= 0 ? experienceIdx + 1 : main.length, 0, { key: "brands", width: "half" });
  }

  // Presence moved out of main into the sidebar (compact card, not a full
  // content section) — same anchor point for every category: right before
  // Trust (TrustCard), when Trust is part of the sidebar at all.
  const trustIdx = sidebar.findIndex((entry) => entry.key === "trust");
  sidebar.splice(trustIdx >= 0 ? trustIdx : sidebar.length, 0, { key: "social", width: "full" });

  if (isModel) {
    const packagesIdx = main.findIndex((entry) => entry.key === "packages");
    main.splice(packagesIdx >= 0 ? packagesIdx + 1 : main.length, 0, { key: "reviews", width: "full" });
  }

  return { ...layout, main, sidebar };
}
