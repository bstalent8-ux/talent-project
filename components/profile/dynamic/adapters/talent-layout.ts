// ─── Category-aware talent layout ─────────────────────────────────────────
// PURE. No React, no I/O — does NOT touch profile_layouts. The stored layout
// (admin-configured, shared by every talent regardless of category) is the
// base; this only inserts the two sections that used to be inline-and-hidden
// (social → Presence, physical → Measurements) at fixed anchor points, so
// UGC and Model get a different information hierarchy from the SAME single
// DynamicProfileRenderer path — not a second hardcoded profile system.
//
// Placement mirrors the product-approved suggested order for both categories:
//   - Presence sits right after Portfolio (both ugc and model agree on this).
//   - Measurements sits right before Portfolio, Model only.
//
// Idempotent: any pre-existing "social"/"physical" entry is dropped and
// reinserted at the anchor, so calling this twice (or on a layout an admin
// later configures explicitly) never produces a duplicate or drifts order.
//
// Legacy/unknown categories (fashion, null, anything but "model") get
// Presence inserted the same way and NO Measurements — no bespoke section is
// invented for them, and nothing about their existing configured sections
// (bio, portfolio, experience, packages, usage_addons, equipment, awards,
// sidebar) is reordered or removed.

import type { ProfileLayoutDTO } from "@/features/profiles/types/dto";
import type { LayoutEntry } from "@/features/profiles/content/layout-entries";

export function applyCategoryTalentLayout(
  layout: ProfileLayoutDTO,
  category: string | null | undefined,
): ProfileLayoutDTO {
  const base = layout.main.filter((entry) => entry.key !== "social" && entry.key !== "physical");
  const main: LayoutEntry[] = [...base];

  if (category === "model") {
    const portfolioIdx = main.findIndex((entry) => entry.key === "portfolio");
    main.splice(portfolioIdx >= 0 ? portfolioIdx : main.length, 0, { key: "physical", width: "full" });
  }

  const portfolioIdxAfter = main.findIndex((entry) => entry.key === "portfolio");
  main.splice(portfolioIdxAfter >= 0 ? portfolioIdxAfter + 1 : main.length, 0, { key: "social", width: "full" });

  return { ...layout, main };
}
