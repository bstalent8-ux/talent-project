// ─── Brand core prop builder ──────────────────────────────────────────────────
// PURE. Mirrors talent.props.ts.
//
// Claims ZERO keys today. The brand core sections seeded in 20260806_08 —
// company_info, industry, verification, logo, social — have no standalone
// components; app/(main)/brand/ renders them inline. Inventing components here
// would be the duplicated rendering logic this layer exists to prevent, and it
// would be new public UI, which this phase excludes.
//
// Everything therefore returns null and falls back to CoreSectionPlaceholder.
// When brand components are extracted, add their keys to
// BRAND_RENDERABLE_CORE_KEYS and a case below — nothing else changes.

import { BRAND_RENDERABLE_CORE_KEYS } from "./core-keys";
import type { BrandProfileContext, CoreSectionRenderPlan } from "./types";

export { BRAND_RENDERABLE_CORE_KEYS as BRAND_CORE_SECTION_KEYS };

export function supportsBrandCoreKey(sectionKey: string): boolean {
  return (BRAND_RENDERABLE_CORE_KEYS as readonly string[]).includes(sectionKey);
}

export function buildBrandCoreProps(
  _sectionKey: string,
  _context: BrandProfileContext,
): CoreSectionRenderPlan | null {
  // TODO(brand-core-components): populate once brand hero / verification /
  // industry components are extracted from app/(main)/brand/.
  return null;
}
