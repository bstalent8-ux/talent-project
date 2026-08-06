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

import { hasSectionContent } from "../content/section-content";
import { brandRepository } from "../repositories/brand.repository";
import { dynamicProfileService } from "../services/dynamic-profile.service";
import type {
  BrandPrivateCore,
  BrandPublicCore,
  CompletionGateDTO,
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
// New logic — no legacy equivalent exists for brands, and deliberately NOT the
// talent weights: a brand has no portfolio, packages or physical attributes, so
// scoring it against lib/profile-completion.ts would cap every brand well below
// 100 no matter how complete it is. The service normalizes to 100 regardless.

const COMPLETION_SECTIONS: Array<Omit<CompletionSectionDTO, "done" | "progress">> = [
  { key: "company_info", label: { ar: "بيانات الشركة",  en: "Company details" }, weight: 25, href: "/profile/me" },
  { key: "bio",          label: { ar: "نبذة عن العلامة", en: "About"          }, weight: 15, href: "/profile/me" },
  { key: "industry",     label: { ar: "المجال",         en: "Industry"        }, weight: 15, href: "/profile/me" },
  { key: "logo",         label: { ar: "الشعار",         en: "Logo"            }, weight: 15, href: "/profile/me" },
  { key: "social",       label: { ar: "مواقع التواصل",  en: "Social media"    }, weight: 15, href: "/profile/me" },
  { key: "verification", label: { ar: "التوثيق",        en: "Verification"    }, weight: 15, href: "/profile/me" },
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

  hasContent(section, profile) {
    return hasSectionContent(meta.typeSlug, section, profile);
  },

  async getCompletion({ shared, core }: ProviderCompletionInput<RawBrandCore>): Promise<CoreSectionState> {
    const social      = (core?.social_links ?? {}) as Record<string, unknown>;
    const filledSocial = SOCIAL_KEYS.filter((k) => social[k] && String(social[k]).trim().length > 2).length;

    const hasName = Boolean(core?.company_name);
    const hasSite = Boolean(core?.website_url);

    return {
      // Two fields, satisfied only by both — so the halfway state is real and
      // worth showing rather than reporting a bare `false`.
      company_info: { done: hasName && hasSite, progress: (Number(hasName) + Number(hasSite)) / 2 },
      social:       { done: filledSocial > 0,   progress: filledSocial / SOCIAL_KEYS.length },

      bio:          Boolean(shared?.bio && shared.bio.trim().length > 0),
      industry:     Boolean(core?.industry || core?.category_id),
      logo:         Boolean(shared?.avatar_url),
      // Admin-driven, not something the brand can fill in. Reported so the card
      // can show it as pending rather than as a task the user is failing at.
      verification: core?.status === "approved",
    };
  },

  async getCoreCompletionSections() {
    return COMPLETION_SECTIONS;
  },

  // Deliberately NOT lib/profile-completion.ts's thresholds: those name talent
  // features (apply to jobs, appear in talent search). A brand shown "apply to
  // jobs at 50%" is being told to chase something it can never do.
  async getCompletionGates(): Promise<Array<Omit<CompletionGateDTO, "passed">>> {
    return [
      { key: "postJobs",       minScore: 40, enforced: false },
      { key: "contactTalents", minScore: 50, enforced: false },
      { key: "appearInSearch", minScore: 60, enforced: false },
    ];
  },

  async validateDynamicFields({ values }): Promise<DynamicValidationResult> {
    return dynamicProfileService.validate(meta.typeSlug, values);
  },

  // resolveBookingTarget intentionally omitted — meta.bookable is false.
};
