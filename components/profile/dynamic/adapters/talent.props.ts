// ─── Talent core prop builder ─────────────────────────────────────────────────
// PURE. No React, no component imports — so it is unit-testable without a DOM
// and without pulling framer-motion / DirectBriefModal / ProtectedAction into
// the test graph.
//
// talent.adapter.tsx imports this and adds only the JSX.

import { TALENT_RENDERABLE_CORE_KEYS } from "./core-keys";
import type { CoreSectionRenderPlan, TalentProfileContext } from "./types";

export { TALENT_RENDERABLE_CORE_KEYS as TALENT_CORE_SECTION_KEYS };

export function supportsTalentCoreKey(sectionKey: string): boolean {
  return (TALENT_RENDERABLE_CORE_KEYS as readonly string[]).includes(sectionKey);
}

/**
 * Section key + provider context → props for the EXISTING component.
 *
 * The prop objects mirror TalentModelProfile's current call sites exactly
 * (its lines 86, 98, 100, 101, 105, 107), so swapping the composition for the
 * dynamic renderer changes nothing the components receive.
 *
 * Returns null for any unclaimed key — never throws.
 */
export function buildTalentCoreProps(
  sectionKey: string,
  context: TalentProfileContext,
): CoreSectionRenderPlan | null {
  switch (sectionKey) {
    // The hero block covers avatar and personal details. All three seeded keys
    // resolve to the same component rather than duplicating it.
    case "hero":
    case "avatar":
    case "personal":
      return { component: "ProfileHero", props: { talent: context.talent } };

    // Only claimed when there is something to show — an empty object would
    // render an empty card, which section-content.ts's rules already prevent
    // from reaching here, but a null/empty guard here too costs nothing and
    // keeps this function correct even if called directly.
    case "social":
      return Object.keys(context.presenceLinks).length > 0
        ? { component: "ProfessionalPresenceSection", props: { links: context.presenceLinks } }
        : null;

    case "physical":
      return context.measurements
        ? { component: "MeasurementsSection", props: { measurements: context.measurements } }
        : null;

    case "portfolio":
      return {
        component: "PortfolioSection",
        props: {
          portfolioItems: context.portfolioItems,
          variant: context.talent.category === "model" ? "model" : "default",
        },
      };

    case "packages":
      return {
        component: "PackagesSection",
        props: {
          onSelect: context.onSelectPackage,
          packages: context.packages,
          variant: context.talent.category === "model" ? "model" : "default",
        },
      };

    case "usage_addons":
      return {
        component: "UsageRightsSection",
        props: { selectedPackage: context.selectedPackage, addons: context.addons },
      };

    case "reviews":
      return {
        component: "ReviewsCard",
        props: {
          reviews: context.reviews,
          rating: context.talent.rating,
          variant: context.talent.category === "model" ? "model" : "default",
        },
      };

    case "experience":
      return {
        component: "ExperienceSection",
        props: {
          talent: context.talent,
          experience: context.experience,
          variant: context.talent.category === "model" ? "model" : "default",
        },
      };

    case "brands":
      return {
        component: "BrandsCard",
        props: {
          brands: context.brands,
          variant: context.talent.category === "model" ? "model" : "default",
        },
      };

    case "performance":
      return {
        component: "PerformanceSidebar",
        props: { talent: context.talent, bookingStats: context.bookingStats },
      };

    case "trust":
      return { component: "TrustCard", props: {} };

    default:
      return null;
  }
}
