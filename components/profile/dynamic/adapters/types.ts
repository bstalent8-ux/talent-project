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
  /** Lifted state: PackagesSection sets it, UsageRightsSection consumes it. */
  selectedPackage: PackageItem | null;
  onSelectPackage: (pkg: PackageItem) => void;
}

export interface BrandProfileContext {
  typeSlug:    "brand";
  companyName: string | null;
  industry:    string | null;
  websiteUrl:  string | null;
  isApproved:  boolean;
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
  | { component: "PortfolioSection";   props: { portfolioItems?: PortfolioItem[] } }
  | { component: "PackagesSection";    props: { onSelect: (pkg: PackageItem) => void; packages?: PackageItem[] | null } }
  | { component: "UsageRightsSection"; props: { selectedPackage: PackageItem | null; addons?: AddonItem[] | null } }
  | { component: "ReviewsCard";        props: { reviews: Review[]; rating?: number } }
  | { component: "TrustCard";          props: Record<string, never> };

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
