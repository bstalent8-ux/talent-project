// ─── Core section adapter contracts ───────────────────────────────────────────
// Core sections are backed by strongly typed provider columns, not by
// profile_values, so a dynamic renderer cannot draw them from a
// ProfileSectionDTO alone. An adapter bridges the two:
//
//   ProfileSectionDTO (what the renderer walks)
//        +
//   ProfileContext    (what the provider already loaded)
//        ↓
//   props for the EXISTING component, unchanged
//
// The existing components under app/(main)/talent/[handle]/_components/ are not
// modified, not wrapped, and not re-implemented.

import type { ReactNode } from "react";
import type { ProfileSectionDTO } from "@/features/profiles/types/dto";
import type {
  AddonItem,
  BookingStats,
  BrandItem,
  ExperienceItem,
  PackageItem,
  PortfolioItem,
  Review,
  TalentData,
} from "@/features/talent-profile/types";

export type CoreProfileTypeSlug = "talent" | "brand";

// ─── Profile context ──────────────────────────────────────────────────────────
// What a provider hands the renderer. Mirrors exactly what TalentModelProfile
// already holds today (see its lines 70, 86-113), so adapters introduce no new
// data requirements.

export interface TalentProfileContext {
  typeSlug:        "talent";
  talent:          TalentData;
  portfolioItems:  PortfolioItem[];
  packages:        PackageItem[] | null;
  addons:          AddonItem[] | null;
  reviews:         Review[];
  experience:      ExperienceItem[] | null;
  brands:          BrandItem[];
  bookingStats:    BookingStats;
  /** Lifted state: PackagesSection sets it, UsageRightsSection consumes it. */
  selectedPackage: PackageItem | null;
  onSelectPackage: (pkg: PackageItem) => void;
  /** Only the platforms the talent actually filled in — see lib/profile-fields.ts. */
  presenceLinks:   Record<string, string>;
  /** Null unless category is "model" and at least one field is filled — see
   *  section-content.ts's `physical` rule, which gates the section itself. */
  measurements:    Record<string, string> | null;
}

export interface BrandProfileContext {
  typeSlug:    "brand";
  companyName: string | null;
  industry:    string | null;
  websiteUrl:  string | null;
  isApproved:  boolean;
  /** From the SHARED identity, not from brand_profiles — brands have no core bio column. */
  bio:         string | null;
  categoryId:  string | null;
  socialLinks: Record<string, unknown>;
}

export type ProfileContext = TalentProfileContext | BrandProfileContext;

// ─── Adapter output ───────────────────────────────────────────────────────────
/**
 * A discriminated union of { component, props } pairs.
 *
 * `props` is typed as the REAL component's prop type, so "adapter output
 * matches component prop requirements" is enforced by the compiler, not only by
 * the tests. Changing a component's props breaks `npx tsc --noEmit` here.
 */
export type CoreSectionRenderPlan =
  | { component: "ProfileHero";        props: { talent: TalentData } }
  | { component: "ProfessionalPresenceSection"; props: { links: Record<string, string> } }
  | { component: "MeasurementsSection";         props: { measurements: Record<string, string> } }
  | { component: "PortfolioSection";   props: { portfolioItems?: PortfolioItem[]; variant?: "default" | "model" } }
  | { component: "PackagesSection";    props: { onSelect: (pkg: PackageItem) => void; packages?: PackageItem[] | null } }
  | { component: "UsageRightsSection"; props: { selectedPackage: PackageItem | null; addons?: AddonItem[] | null } }
  | { component: "ReviewsCard";        props: { reviews: Review[]; rating?: number } }
  | { component: "ExperienceSection";  props: { experience?: ExperienceItem[] | null; variant?: "default" | "model" } }
  | { component: "BrandsCard";         props: { brands: BrandItem[] } }
  | { component: "PerformanceSidebar"; props: { talent: TalentData; bookingStats?: BookingStats } }
  | { component: "TrustCard";          props: Record<string, never> }
  // Brand core sections. `logo` is absent: it is carried by BrandHero, which the
  // page renders as chrome above the layout slots.
  | { component: "BrandAboutCard";        props: { bio: string | null } }
  | { component: "BrandCompanyCard";      props: { companyName: string | null; websiteUrl: string | null } }
  | { component: "BrandIndustryCard";     props: { industry: string | null; categoryId: string | null } }
  | { component: "BrandSocialCard";       props: { socialLinks: Record<string, unknown> } }
  | { component: "BrandVerificationCard"; props: { isApproved: boolean } };

export interface CoreSectionAdapter<TContext extends ProfileContext = ProfileContext> {
  readonly typeSlug: CoreProfileTypeSlug;
  /** Section keys this adapter can render. Everything else falls back safely. */
  readonly supportedKeys: readonly string[];

  supports(sectionKey: string): boolean;

  /**
   * Pure: section key + context → component props. No JSX, no side effects.
   * Split out from `render` so it is unit-testable without a DOM.
   * Returns null for an unsupported key — never throws.
   */
  buildProps(sectionKey: string, context: TContext): CoreSectionRenderPlan | null;

  /** Renders the existing component with the built props. Null when unsupported. */
  render(section: ProfileSectionDTO, context: TContext): ReactNode | null;
}
