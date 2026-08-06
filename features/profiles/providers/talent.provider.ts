import "server-only";

// ─── TalentProfileProvider ────────────────────────────────────────────────────
// The only code that knows `talent_profiles` exists, alongside TalentRepository.
//
// Phase 2 rule: BEHAVIOUR IS UNCHANGED. Field lists, public filters and the
// completion calculation are copied from, or delegate to, the code that ships
// today. This provider is a seam, not a rewrite.

import { calculateCompletion } from "@/lib/profile-completion";
import { hasSectionContent } from "../content/section-content";
import { profileRepository } from "../repositories/profile.repository";
import { talentRepository } from "../repositories/talent.repository";
import { dynamicProfileService } from "../services/dynamic-profile.service";
import type {
  BookingStatsDTO,
  BookingTarget,
  CompletionSectionDTO,
  CoreSectionState,
  DynamicValidationResult,
  PackageItemDTO,
  PortfolioItemDTO,
  ProfileSectionDTO,
  ReviewItemDTO,
  TalentBrandDTO,
  TalentPrivateCore,
  TalentPublicCore,
} from "../types/dto";
import type {
  ProfileProvider,
  ProviderCompletionInput,
  ProviderLoadInput,
  ProviderMetadata,
  PrivateCoreResult,
} from "../types/provider";
import type {
  RawPortfolioRow,
  RawReviewRow,
  RawTalentBrandRow,
  RawTalentCore,
} from "../types/raw";

// ─── Metadata ─────────────────────────────────────────────────────────────────

const meta: ProviderMetadata = {
  typeSlug:    "talent",
  coreTable:   "talent_profiles",
  bookable:    true,
  routePrefix: "talent",
  label:       { ar: "موهبة", en: "Talent" },
  // Byte-identical to TALENT_FIELDS in app/api/profile/route.ts:18.
  // avg_rating / total_reviews / total_bookings are trigger-maintained and
  // deliberately absent — they must never be user-writable.
  writableCoreFields: ["category", "specialties", "social_links", "bio", "packages", "availability"],
};

// ─── Local transformers ───────────────────────────────────────────────────────
// Mirrors features/talent-profile/transformers so the payload shape does not
// drift while both paths coexist.

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${Math.round(views / 1_000)}K`;
  return String(views);
}

function toPackages(raw: unknown): PackageItemDTO[] {
  if (!Array.isArray(raw)) return [];
  const out: PackageItemDTO[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (!r.id || !r.name || !r.price) continue;
    out.push({
      id:       String(r.id),
      name:     String(r.name),
      price:    String(r.price),
      popular:  Boolean(r.popular),
      features: Array.isArray(r.features) ? r.features.map(String) : [],
    });
  }
  return out;
}

function toPortfolio(rows: RawPortfolioRow[]): PortfolioItemDTO[] {
  return rows.map((r) => ({
    id:         r.id,
    url:        r.url,
    mediaType:  r.media_type,
    caption:    r.caption,
    sortOrder:  r.sort_order,
    isApproved: r.is_approved,
  }));
}

function toReviews(
  rows: RawReviewRow[],
  authorByBrandId: Record<string, string | null>,
): ReviewItemDTO[] {
  return rows.map((r) => ({
    id:        r.id,
    author:    authorByBrandId[r.brand_id] ?? "Client",
    rating:    r.rating,
    text:      r.comment ?? "",
    createdAt: r.created_at,
  }));
}

function toBrands(rows: RawTalentBrandRow[]): TalentBrandDTO[] {
  return rows.map((r) => ({
    id:               r.id,
    name:             r.brand_name,
    logoUrl:          r.logo_url ?? null,
    yearCollaborated: r.year_collaborated ?? null,
    sortOrder:        r.sort_order ?? 0,
  }));
}

function toBookingStats(rows: Array<{ status: string }>): BookingStatsDTO {
  return {
    total:     rows.length,
    completed: rows.filter((r) => r.status === "completed").length,
    pending:   rows.filter((r) => r.status === "pending").length,
    cancelled: rows.filter((r) => r.status === "cancelled").length,
  };
}

function buildPublicCore(core: RawTalentCore, parts: {
  portfolio: PortfolioItemDTO[];
  reviews:   ReviewItemDTO[];
  brands:    TalentBrandDTO[];
}): TalentPublicCore {
  return {
    kind:          "talent",
    category:      core.category,
    specialties:   core.specialties ?? [],
    availability:  core.availability,
    packages:      toPackages(core.packages),
    socialLinks:   core.social_links ?? {},
    rating:        core.avg_rating ?? 0,
    reviewCount:   core.total_reviews ?? 0,
    totalBookings: core.total_bookings ?? 0,
    views:         formatViews(core.profile_views ?? 0),
    isFeatured:    Boolean(core.is_featured),
    portfolio:     parts.portfolio,
    reviews:       parts.reviews,
    brands:        parts.brands,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const talentProvider: ProfileProvider<RawTalentCore, TalentPublicCore, TalentPrivateCore> = {
  meta,

  async loadCore(profileId) {
    return talentRepository.findByUserId(profileId);
  },

  async getPublicProfile({ shared }: ProviderLoadInput) {
    const core = await talentRepository.findByUserId(shared.id);
    if (!core) return null;

    // The public gate. Today this filter is reapplied per-route; centralizing
    // it here is how it stops being forgotten (CLAUDE.md §8).
    if (core.status && core.status !== "approved") return null;

    const [portfolio, reviews, brands] = await Promise.all([
      talentRepository.findPortfolio(core.id, true),
      talentRepository.findReviews(core.id, true),
      talentRepository.findBrands(core.id),
    ]);

    // Reviewer names: one batched profiles lookup keyed by reviews.brand_id,
    // matching fetchReviewsByTalentId. No review table structure changes.
    const authorByBrandId = await profileRepository.findDisplayNames(
      reviews.map((review) => review.brand_id),
    );

    return buildPublicCore(core, {
      portfolio: toPortfolio(portfolio),
      reviews:   toReviews(reviews, authorByBrandId),
      brands:    toBrands(brands),
    });
  },

  async getPrivateProfile({ shared }: ProviderLoadInput): Promise<PrivateCoreResult<TalentPrivateCore> | null> {
    const core = await talentRepository.findByUserId(shared.id);
    if (!core) return null;

    // No status gate: the owner always sees their own profile, including while
    // it is pending or rejected.
    const [portfolio, reviews, brands, bookingRows] = await Promise.all([
      talentRepository.findPortfolio(core.id, false),
      talentRepository.findReviews(core.id, false),
      talentRepository.findBrands(core.id),
      talentRepository.findBookingStatuses(core.id),
    ]);

    const authorByBrandId = await profileRepository.findDisplayNames(
      reviews.map((review) => review.brand_id),
    );

    const publicShape = buildPublicCore(core, {
      portfolio: toPortfolio(portfolio),
      reviews:   toReviews(reviews, authorByBrandId),
      brands:    toBrands(brands),
    });

    return {
      core: { ...publicShape, bookingStats: toBookingStats(bookingRows) },
      moderation: {
        status:          core.status,
        rejectionReason: core.rejection_reason,
        approvedAt:      core.approved_at,
      },
    };
  },

  async updateProfile({ profileId, corePatch }) {
    // Filtered again here as defence in depth — this write goes through the
    // service role, so a mass-assignment hole would reach moderation columns.
    const safe: Record<string, unknown> = {};
    for (const key of meta.writableCoreFields) {
      if (key in corePatch) safe[key] = corePatch[key];
    }
    if (Object.keys(safe).length === 0) return;

    await talentRepository.upsert(profileId, safe);
  },

  async getSections(): Promise<ProfileSectionDTO[]> {
    return dynamicProfileService.getSectionDefinitions(meta.typeSlug);
  },

  // Rules live in ../content/section-content so the client renderer can reach
  // the identical answer — that module is deliberately not server-only.
  hasContent(section, profile) {
    return hasSectionContent(meta.typeSlug, section, profile);
  },

  async getCompletion({ shared, core }: ProviderCompletionInput<RawTalentCore>): Promise<CoreSectionState> {
    if (!core) return {};

    const portfolio = await talentRepository.findPortfolio(core.id, false);

    // Delegates verbatim to the shipped implementation so scores cannot
    // regress. Phase 3 replaces the internals behind this same signature.
    const { sections } = calculateCompletion(shared, core, portfolio);
    return Object.fromEntries(sections.map((s) => [s.key, s.done]));
  },

  async getCoreCompletionSections(): Promise<Array<Omit<CompletionSectionDTO, "done">>> {
    // Derived from the same source of truth as getCompletion, with an empty
    // fixture, so weights and labels can never drift from the calculation.
    const { sections } = calculateCompletion({}, {}, []);
    return sections.map((s) => ({
      key:    s.key,
      label:  s.label,
      weight: s.weight,
      href:   s.href,
    }));
  },

  async validateDynamicFields({ values }): Promise<DynamicValidationResult> {
    return dynamicProfileService.validate(meta.typeSlug, values);
  },

  async resolveBookingTarget(profileId: string): Promise<BookingTarget | null> {
    const core = await talentRepository.findByUserId(profileId);
    if (!core) return null;

    // Same gate as app/api/bookings/direct/route.ts:96. Returning null here
    // must produce the identical 403 at the controller in Part 2.
    if (core.status && core.status !== "approved") return null;

    return {
      providerType:      meta.typeSlug,
      providerProfileId: core.id,
      providerUserId:    core.user_id,
      // The backward-compatibility hinge: bookings.talent_id keeps its exact
      // current meaning (talent_profiles.id).
      legacyTalentId:    core.id,
    };
  },
};
