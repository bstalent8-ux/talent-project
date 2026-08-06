// ─── Brand core prop builder ──────────────────────────────────────────────────
// PURE. Mirrors talent.props.ts: section key + context → component props, no JSX
// and no side effects, so the mapping is unit-testable without a DOM.
//
// Every branch returns props for a component that already decides its own empty
// state. The section-content rules hide these sections server-side first, so a
// null return here is a second line of defence, not the primary one.

import { BRAND_RENDERABLE_CORE_KEYS } from "./core-keys";
import type { BrandProfileContext, CoreSectionRenderPlan } from "./types";

export { BRAND_RENDERABLE_CORE_KEYS as BRAND_CORE_SECTION_KEYS };

export function supportsBrandCoreKey(sectionKey: string): boolean {
  return (BRAND_RENDERABLE_CORE_KEYS as readonly string[]).includes(sectionKey);
}

export function buildBrandCoreProps(
  sectionKey: string,
  context: BrandProfileContext,
): CoreSectionRenderPlan | null {
  switch (sectionKey) {
    case "bio":
      return { component: "BrandAboutCard", props: { bio: context.bio } };

    case "company_info":
      return {
        component: "BrandCompanyCard",
        props: { companyName: context.companyName, websiteUrl: context.websiteUrl },
      };

    case "industry":
      return {
        component: "BrandIndustryCard",
        props: { industry: context.industry, categoryId: context.categoryId },
      };

    case "social":
      return { component: "BrandSocialCard", props: { socialLinks: context.socialLinks } };

    case "verification":
      return { component: "BrandVerificationCard", props: { isApproved: context.isApproved } };

    // `logo` is deliberately unclaimed — BrandHero carries it as page chrome.
    default:
      return null;
  }
}
