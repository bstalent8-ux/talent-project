"use client";

// ─── BrandCoreSectionAdapter ──────────────────────────────────────────────────
// Maps brand core section keys to the components in components/profile/brand/.
//
// Mirrors talent.adapter.tsx exactly: the prop-building half is pure and lives
// in brand.props.ts, this file adds only the JSX.

import BrandAboutCard from "@/components/profile/brand/BrandAboutCard";
import BrandCompanyCard from "@/components/profile/brand/BrandCompanyCard";
import BrandIndustryCard from "@/components/profile/brand/BrandIndustryCard";
import BrandSocialCard from "@/components/profile/brand/BrandSocialCard";
import BrandVerificationCard from "@/components/profile/brand/BrandVerificationCard";

import type { ProfileSectionDTO } from "@/features/profiles/types/dto";
import {
  BRAND_CORE_SECTION_KEYS,
  buildBrandCoreProps,
  supportsBrandCoreKey,
} from "./brand.props";
import type { BrandProfileContext, CoreSectionAdapter, CoreSectionRenderPlan } from "./types";

export { BRAND_CORE_SECTION_KEYS, buildBrandCoreProps };

/** Exhaustive over the brand half of CoreSectionRenderPlan. */
function renderPlan(plan: CoreSectionRenderPlan) {
  switch (plan.component) {
    case "BrandAboutCard":        return <BrandAboutCard {...plan.props} />;
    case "BrandCompanyCard":      return <BrandCompanyCard {...plan.props} />;
    case "BrandIndustryCard":     return <BrandIndustryCard {...plan.props} />;
    case "BrandSocialCard":       return <BrandSocialCard {...plan.props} />;
    case "BrandVerificationCard": return <BrandVerificationCard {...plan.props} />;
    default:                      return null;
  }
}

export const brandCoreSectionAdapter: CoreSectionAdapter<BrandProfileContext> = {
  typeSlug:      "brand",
  supportedKeys: BRAND_CORE_SECTION_KEYS,

  supports: supportsBrandCoreKey,

  buildProps(sectionKey, context) {
    return buildBrandCoreProps(sectionKey, context);
  },

  render(section: ProfileSectionDTO, context: BrandProfileContext) {
    const plan = buildBrandCoreProps(section.key, context);
    if (!plan) return null;
    return renderPlan(plan);
  },
};
