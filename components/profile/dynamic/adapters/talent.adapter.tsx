"use client";

// ─── TalentCoreSectionAdapter ─────────────────────────────────────────────────
// Maps core section keys to the EXISTING talent profile components.
//
// Those components are imported as-is from
// app/(main)/talent/[handle]/_components/ and receive exactly the props
// TalentModelProfile already gives them today. Nothing is re-implemented here
// and no rendering logic is duplicated.
//
// The prop-building half lives in talent.props.ts (pure, unit-tested); this
// file adds only the JSX.

import ProfileHero from "@/app/(main)/talent/[handle]/_components/ProfileHero";
import ProfessionalPresenceSection from "@/app/(main)/talent/[handle]/_components/ProfessionalPresenceSection";
import MeasurementsSection from "@/app/(main)/talent/[handle]/_components/MeasurementsSection";
import PortfolioSection from "@/app/(main)/talent/[handle]/_components/PortfolioSection";
import PackagesSection from "@/app/(main)/talent/[handle]/_components/PackagesSection";
import UsageRightsSection from "@/app/(main)/talent/[handle]/_components/UsageRightsSection";
import ReviewsCard from "@/app/(main)/talent/[handle]/_components/ReviewsCard";
import ExperienceSection from "@/app/(main)/talent/[handle]/_components/ExperienceSection";
import BrandsCard from "@/app/(main)/talent/[handle]/_components/BrandsCard";
import PerformanceSidebar from "@/app/(main)/talent/[handle]/_components/PerformanceSidebar";
import TrustCard from "@/app/(main)/talent/[handle]/_components/TrustCard";

import type { ProfileSectionDTO } from "@/features/profiles/types/dto";
import {
  TALENT_CORE_SECTION_KEYS,
  buildTalentCoreProps,
  supportsTalentCoreKey,
} from "./talent.props";
import type { CoreSectionAdapter, CoreSectionRenderPlan, TalentProfileContext } from "./types";

export { TALENT_CORE_SECTION_KEYS, buildTalentCoreProps };

/** Exhaustive over CoreSectionRenderPlan — a new variant becomes a type error. */
function renderPlan(plan: CoreSectionRenderPlan) {
  switch (plan.component) {
    case "ProfileHero":        return <ProfileHero {...plan.props} />;
    case "ProfessionalPresenceSection": return <ProfessionalPresenceSection {...plan.props} />;
    case "MeasurementsSection":         return <MeasurementsSection {...plan.props} />;
    case "PortfolioSection":   return <PortfolioSection {...plan.props} />;
    case "PackagesSection":    return <PackagesSection {...plan.props} />;
    case "UsageRightsSection": return <UsageRightsSection {...plan.props} />;
    case "ReviewsCard":        return <ReviewsCard {...plan.props} />;
    case "ExperienceSection":  return <ExperienceSection {...plan.props} />;
    case "BrandsCard":         return <BrandsCard {...plan.props} />;
    case "PerformanceSidebar": return <PerformanceSidebar {...plan.props} />;
    case "TrustCard":          return <TrustCard />;
    default:                   return null;
  }
}

export const talentCoreSectionAdapter: CoreSectionAdapter<TalentProfileContext> = {
  typeSlug:      "talent",
  supportedKeys: TALENT_CORE_SECTION_KEYS,

  supports: supportsTalentCoreKey,

  buildProps(sectionKey, context) {
    return buildTalentCoreProps(sectionKey, context);
  },

  render(section: ProfileSectionDTO, context: TalentProfileContext) {
    const plan = buildTalentCoreProps(section.key, context);
    if (!plan) return null;
    return renderPlan(plan);
  },
};
