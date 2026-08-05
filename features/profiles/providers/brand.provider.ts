import "server-only";

// ─── BrandProfileProvider ─────────────────────────────────────────────────────
// The only code that knows `brand_profiles` exists, alongside BrandRepository.
//
// Not bookable: `resolveBookingTarget` is deliberately ABSENT, so asking a
// brand for a booking target is a compile error, not a runtime one.
//
// Known drift preserved on purpose: `profiles.brand_status` and
// `brand_profiles.status` are two overlapping brand approval flags
// (CLAUDE.md §8). Phase 2 reads what the code reads today and unifies nothing —
// that is Phase 4 work, and doing it here would smuggle a behaviour change
// into a refactor.

import { brandRepository } from "../repositories/brand.repository";
import { dynamicProfileService } from "../services/dynamic-profile.service";
import type {
  BrandPrivateCore,
  BrandPublicCore,
  CompletionSectionDTO,
  CoreSectionState,
  DynamicValidationResult,
  ProfileSectionDTO,
} from "../types/dto";
import type {
  ProfileProvider,
  ProviderCompletionInput,
  ProviderLoadInput,
  ProviderMetadata,
  PrivateCoreResult,
} from "../types/provider";
import type { RawBrandCore } from "../types/raw";

// ─── Metadata ─────────────────────────────────────────────────────────────────

const meta: ProviderMetadata = {
  typeSlug:    "brand",
  coreTable:   "brand_profiles",
  bookable:    false,
  routePrefix: "brand",
  label:       { ar: "علامة تجارية", en: "Brand" },
  // Byte-identical to BRAND_FIELDS in app/api/profile/route.ts:22.
  writableCoreFields: ["company_name", "category_id", "industry", "website_url", "social_links"],
};

// ─── Completion sections ──────────────────────────────────────────────────────
// New logic — no legacy equivalent exists for brands. Weights sum to 100 so the
// score is directly readable; the Phase 3 engine normalizes regardless.

const COMPLETION_SECTIONS: Array<Omit<CompletionSectionDTO, "done">> = [
  { key: "company_info", label: { ar: "بيانات الشركة",  en: "Company details" }, weight: 30, href: "/profile/me" },
  { key: "industry",     label: { ar: "المجال",         en: "Industry"        }, weight: 20, href: "/profile/me" },
  { key: "logo",         label: { ar: "الشعار",         en: "Logo"            }, weight: 15, href: "/profile/me" },
  { key: "social",       label: { ar: "مواقع التواصل",  en: "Social media"    }, weight: 15, href: "/profile/me" },
  { key: "verification", label: { ar: "التوثيق",        en: "Verification"    }, weight: 20, href: "/profile/me" },
];

const SOCIAL_KEYS = ["instagram", "tiktok", "youtube", "linkedin", "facebook", "x"];

// ─── Transformers ─────────────────────────────────────────────────────────────

function buildPublicCore(core: RawBrandCore): BrandPublicCore {
  return {
    kind:        "brand",
    companyName: core.company_name,
    industry:    core.industry,
    websiteUrl:  core.website_url,
    categoryId:  core.category_id,
    socialLinks: core.social_links ?? {},
    isApproved:  core.status === "approved",
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const brandProvider: ProfileProvider<RawBrandCore, BrandPublicCore, BrandPrivateCore> = {
  meta,

  async loadCore(profileId) {
    return brandRepository.findByUserId(profileId);
  },

  async getPublicProfile({ shared }: ProviderLoadInput) {
    const core = await brandRepository.findByUserId(shared.id);
    if (!core) return null;

    // Public gate — approved brands only (CLAUDE.md §8).
    if (core.status && core.status !== "approved") return null;

    return buildPublicCore(core);
  },

  async getPrivateProfile({ shared }: ProviderLoadInput): Promise<PrivateCoreResult<BrandPrivateCore> | null> {
    const core = await brandRepository.findByUserId(shared.id);
    if (!core) return null;

    return {
      core: { ...buildPublicCore(core), profileViews: core.profile_views ?? 0 },
      moderation: {
        status:          core.status,
        rejectionReason: core.rejection_reason,
        approvedAt:      core.approved_at,
      },
    };
  },

  async updateProfile({ profileId, corePatch }) {
    const safe: Record<string, unknown> = {};
    for (const key of meta.writableCoreFields) {
      if (key in corePatch) safe[key] = corePatch[key];
    }
    if (Object.keys(safe).length === 0) return;

    await brandRepository.upsert(profileId, safe);
  },

  async getSections(): Promise<ProfileSectionDTO[]> {
    return dynamicProfileService.getSectionDefinitions(meta.typeSlug);
  },

  async getCompletion({ shared, core }: ProviderCompletionInput<RawBrandCore>): Promise<CoreSectionState> {
    const social = (core?.social_links ?? {}) as Record<string, unknown>;
    const hasSocial = SOCIAL_KEYS.some((k) => social[k] && String(social[k]).trim().length > 2);

    return {
      company_info: Boolean(core?.company_name && core?.website_url),
      industry:     Boolean(core?.industry || core?.category_id),
      logo:         Boolean(shared?.avatar_url),
      social:       hasSocial,
      verification: core?.status === "approved",
    };
  },

  async getCoreCompletionSections() {
    return COMPLETION_SECTIONS;
  },

  async validateDynamicFields({ values }): Promise<DynamicValidationResult> {
    return dynamicProfileService.validate(meta.typeSlug, values);
  },

  // resolveBookingTarget intentionally omitted — meta.bookable is false.
};
