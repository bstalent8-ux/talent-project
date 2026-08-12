// ─── Section content predicates ───────────────────────────────────────────────
// "Does this section have anything worth showing?"
//
// DELIBERATELY NOT `server-only`. Providers are server-only, but the renderer is
// a client component, and both must reach the SAME answer — a section the
// service filtered out must never reappear because a component disagreed. So
// the rules live here, in one pure module with no I/O and no DB types, and both
// sides import it:
//
//   server → provider.hasContent()  → filters PublicProfileDTO.sections
//   client → hasSectionContent()    → defence in depth in DynamicSectionRenderer
//
// The predicate takes the whole ProfileSectionDTO, not just its key, because
// `kind === "dynamic"` sections are answered generically from their field
// values — a new admin-created section needs no code here.

import type {
  BrandPublicCore,
  ProfileSectionDTO,
  PublicProfileDTO,
  TalentPublicCore,
} from "../types/dto";
import { TALENT_PHYSICAL_KEYS, TALENT_SOCIAL_KEYS } from "@/lib/profile-fields";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}

function bag(core: { socialLinks?: Record<string, unknown> }): Record<string, unknown> {
  return core.socialLinks ?? {};
}

/** A handle is not a link. Two characters filters out "@" and stray whitespace. */
function hasSocialHandle(links: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.some((key) => {
    const value = links[key];
    return typeof value === "string" && value.trim().length > 2;
  });
}

function listLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

const BRAND_SOCIAL_KEYS  = ["instagram", "tiktok", "youtube", "linkedin", "facebook", "x"] as const;

// ─── Per-type rules ───────────────────────────────────────────────────────────
// Keys mirror lib/profile-completion.ts and adapters/core-keys.ts, so a section
// that scores for completion is the same section that can appear publicly.

type ContentRule = (profile: PublicProfileDTO) => boolean;

const TALENT_RULES: Record<string, ContentRule> = {
  // Identity always exists, so the hero always has something to draw. Hiding it
  // would leave a profile with no name.
  hero:     () => true,
  avatar:   () => true,
  personal: () => true,

  // TrustCard is static platform copy, not user data — it never empties out.
  trust:    () => true,

  // Weight-0 "coming soon" section in lib/profile-completion.ts. Never public.
  payment:  () => false,

  bio: (p) => isFilled(p.identity.bio),

  categories: (p) => {
    const core = p.core as TalentPublicCore;
    return isFilled(core.category) || listLength(core.specialties) > 0;
  },

  social: (p) => hasSocialHandle(bag(p.core as TalentPublicCore), TALENT_SOCIAL_KEYS),

  physical: (p) => {
    const links = bag(p.core as TalentPublicCore);
    return TALENT_PHYSICAL_KEYS.some((key) => isFilled(links[key]));
  },

  portfolio: (p) => listLength((p.core as TalentPublicCore).portfolio) > 0,
  packages:  (p) => listLength((p.core as TalentPublicCore).packages) > 0,
  reviews:   (p) => listLength((p.core as TalentPublicCore).reviews) > 0,
  brands:    (p) => listLength((p.core as TalentPublicCore).brands) > 0,

  // Add-ons and past collaborations still live in the social_links JSONB blob
  // (CLAUDE.md §7), which is why they read through `bag()` and not a column.
  usage_addons: (p) => listLength(bag(p.core as TalentPublicCore)["usage_addons"]) > 0,
  experience:   (p) => listLength(bag(p.core as TalentPublicCore)["experience"]) > 0,

  availability: (p) => isFilled((p.core as TalentPublicCore).availability),

  // Rating/bookings only mean something once at least one exists — a sidebar of
  // zeroes reads as an abandoned profile.
  performance: (p) => {
    const core = p.core as TalentPublicCore;
    return core.reviewCount > 0 || core.totalBookings > 0 || core.rating > 0;
  },
};

const BRAND_RULES: Record<string, ContentRule> = {
  bio:          (p) => isFilled(p.identity.bio),
  company_info: (p) => isFilled((p.core as BrandPublicCore).companyName),
  industry:     (p) => {
    const core = p.core as BrandPublicCore;
    return isFilled(core.industry) || isFilled(core.categoryId);
  },
  logo:         (p) => isFilled(p.identity.avatarUrl),
  website:      (p) => isFilled((p.core as BrandPublicCore).websiteUrl),
  social:       (p) => hasSocialHandle(bag(p.core as BrandPublicCore), BRAND_SOCIAL_KEYS),
  verification: (p) => (p.core as BrandPublicCore).isApproved,
};

const RULES_BY_TYPE: Record<string, Record<string, ContentRule>> = {
  talent: TALENT_RULES,
  brand:  BRAND_RULES,
};

// ─── Entry points ─────────────────────────────────────────────────────────────

/**
 * Generic rule for admin-configured sections: a dynamic section has content when
 * at least one of its fields holds a non-empty value.
 */
export function dynamicSectionHasContent(section: ProfileSectionDTO): boolean {
  return section.fields.some((field) => isFilled(field.value));
}

/**
 * The single source of truth for section visibility.
 *
 * An UNKNOWN core key returns true. A core section exists because a typed column
 * backs it, so failing open shows a section the rules do not cover yet; failing
 * closed would silently delete part of a live profile after a config change.
 */
export function hasSectionContent(
  typeSlug: string,
  section: ProfileSectionDTO,
  profile: PublicProfileDTO,
): boolean {
  if (section.kind === "dynamic") return dynamicSectionHasContent(section);

  const rule = RULES_BY_TYPE[typeSlug]?.[section.key];
  if (!rule) return true;

  try {
    return rule(profile);
  } catch (error) {
    console.error("[profiles] content rule threw", section.key, error);
    return true;
  }
}

/** Key-only variant, for callers holding no ProfileSectionDTO. Core keys only. */
export function hasCoreSectionContent(
  typeSlug: string,
  sectionKey: string,
  profile: PublicProfileDTO,
): boolean {
  const rule = RULES_BY_TYPE[typeSlug]?.[sectionKey];
  return rule ? rule(profile) : true;
}

/** Filters a section list down to the ones that will actually render. */
export function filterSectionsWithContent(
  typeSlug: string,
  sections: ProfileSectionDTO[],
  profile: PublicProfileDTO,
): ProfileSectionDTO[] {
  return sections.filter((section) => hasSectionContent(typeSlug, section, profile));
}
