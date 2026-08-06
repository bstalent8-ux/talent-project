"use client";

// ─── BrandCoreSectionAdapter ──────────────────────────────────────────────────
// The seam for brand core sections. Claims zero keys today — see brand.props.ts
// for why. Every key falls back to CoreSectionPlaceholder.

import type { ProfileSectionDTO } from "@/features/profiles/types/dto";
import {
  BRAND_CORE_SECTION_KEYS,
  buildBrandCoreProps,
  supportsBrandCoreKey,
} from "./brand.props";
import type { BrandProfileContext, CoreSectionAdapter } from "./types";

export { BRAND_CORE_SECTION_KEYS, buildBrandCoreProps };

export const brandCoreSectionAdapter: CoreSectionAdapter<BrandProfileContext> = {
  typeSlug:      "brand",
  supportedKeys: BRAND_CORE_SECTION_KEYS,

  supports: supportsBrandCoreKey,

  buildProps(sectionKey, context) {
    return buildBrandCoreProps(sectionKey, context);
  },

  render(_section: ProfileSectionDTO, _context: BrandProfileContext) {
    return null;
  },
};
