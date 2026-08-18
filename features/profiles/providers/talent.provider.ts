import "server-only";

// ─── TalentProfileProvider ────────────────────────────────────────────────────
// The only code that knows `talent_profiles` exists, alongside TalentRepository.
//
// Phase 2 rule: BEHAVIOUR IS UNCHANGED. Field lists, public filters and the
// completion calculation are copied from, or delegate to, the code that ships
// today. This provider is a seam, not a rewrite.

import {
  COMPLETION_THRESHOLDS,
  calculateCompletion,
  calculateSectionProgress,
} from "@/lib/profile-completion";
import { hasSectionContent } from "../content/section-content";
import { profileRepository } from "../repositories/profile.repository";
import { talentRepository } from "../repositories/talent.repository";
import { dynamicProfileService } from "../services/dynamic-profile.service";
import type {
  BookingStatsDTO,
  BookingTarget,
  CompletionGateDTO,
  CompletionSectionDTO,
  CoreSectionState,
  DynamicValidationResult,
  ModelMetricsDTO,
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
  writableCoreFields: ["category", "specialties", "social_links", "bio", "packages", "availability", "availability_schedule"],
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
    verified:         Boolean(r.verified),
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

function toModelMetrics(raw: unknown): ModelMetricsDTO {
  const r = (raw && typeof raw === "object") ? raw as Record<string, unknown> : {};
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    responseTimeLabel: str(r.response_time_label),
    responseRate:      num(r.response_rate),
    repeatClientRate:  num(r.repeat_client_rate),
    onTimeRate:        num(r.on_time_rate),
    avgProjectValue:   num(r.avg_project_value),
    noShowRate:        num(r.no_show_rate),
    tier:              str(r.tier),
  };
}

function buildPublicCore(core: RawTalentCore, parts: {
  portfolio:         PortfolioItemDTO[];
  reviews:           ReviewItemDTO[];
  brands:            TalentBrandDTO[];
  bookingStats:      BookingStatsDTO;
  identityVerified:  boolean;
}): TalentPublicCore {
  return {
    kind:          "talent",
    category:      core.category,
    specialties:   core.specialties ?? [],
    availability:  core.availability,
    availabilitySchedule: core.availability_schedule ?? null,
    modelMetrics:  toModelMetrics(core.model_metrics),
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
    bookingStats:  parts.bookingStats,
    identityVerified: parts.identityVerified,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const talentProvider: ProfileProvider<RawTalentCore, TalentPublicCore, TalentPrivateCore> = {
  meta,

  async loadCore(profileId) {
    return talentRepository.findByUserId(profileId);
  },

  async getPublicProfile({ shared, bypassApprovalGate }: ProviderLoadInput) {
    const core = await talentRepository.findByUserId(shared.id);
    if (!core) return null;

    // The public gate. Today this filter is reapplied per-route; centralizing
    // it here is how it stops being forgotten (CLAUDE.md §8). Skipped only for
    // the owner's own read-only preview — see ProviderLoadInput's doc comment.
    if (!bypassApprovalGate && core.status && core.status !== "approved") return null;

    const [portfolio, reviews, brands, bookingRows, identityVerified] = await Promise.all([
      talentRepository.findPortfolio(core.id, true),
      talentRepository.findReviews(core.id, true),
      talentRepository.findBrands(core.id),
      talentRepository.findBookingStatuses(core.id),
      talentRepository.findApprovedVerification(core.user_id),
    ]);

    // Reviewer names: one batched profiles lookup keyed by reviews.brand_id,
    // matching fetchReviewsByTalentId. No review table structure changes.
    const authorByBrandId = await profileRepository.findDisplayNames(
      reviews.map((review) => review.brand_id),
    );

    return buildPublicCore(core, {
      portfolio:    toPortfolio(portfolio),
      reviews:      toReviews(reviews, authorByBrandId),
      brands:       toBrands(brands),
      bookingStats: toBookingStats(bookingRows),
      identityVerified,
    });
  },

  async getPrivateProfile({ shared }: ProviderLoadInput): Promise<PrivateCoreResult<TalentPrivateCore> | null> {
    const core = await talentRepository.findByUserId(shared.id);
    if (!core) return null;

    // No status gate: the owner always sees their own profile, including while
    // it is pending or rejected.
    const [portfolio, reviews, brands, bookingRows, identityVerified] = await Promise.all([
      talentRepository.findPortfolio(core.id, false),
      talentRepository.findReviews(core.id, false),
      talentRepository.findBrands(core.id),
      talentRepository.findBookingStatuses(core.id),
      talentRepository.findApprovedVerification(core.user_id),
    ]);

    const authorByBrandId = await profileRepository.findDisplayNames(
      reviews.map((review) => review.brand_id),
    );

    const publicShape = buildPublicCore(core, {
      portfolio:    toPortfolio(portfolio),
      reviews:      toReviews(reviews, authorByBrandId),
      brands:       toBrands(brands),
      bookingStats: toBookingStats(bookingRows),
      identityVerified,
    });

    return {
      core: publicShape,
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

    // `done` delegates verbatim to the shipped implementation so scores cannot
    // regress. The progress ratios are additive and never feed the score.
    const { sections } = calculateCompletion(shared, core, portfolio);
    const progressByKey = calculateSectionProgress(shared, core, portfolio);

    return Object.fromEntries(
      sections.map((s) => {
        const progress = progressByKey[s.key];
        return [s.key, progress === undefined ? s.done : { done: s.done, progress }];
      }),
    );
  },

  async getCoreCompletionSections(): Promise<Array<Omit<CompletionSectionDTO, "done" | "progress">>> {
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

  // Thresholds come from the shipped constant, so the card and any future
  // enforcement read one number. `enforced: false` is the truthful answer today
  // — nothing in app/api/** checks these yet (CLAUDE.md §10.5).
  async getCompletionGates(): Promise<Array<Omit<CompletionGateDTO, "passed">>> {
    return [
      { key: "applyToJobs",    minScore: COMPLETION_THRESHOLDS.applyToJobs,    enforced: false },
      { key: "appearInSearch", minScore: COMPLETION_THRESHOLDS.appearInSearch, enforced: false },
      { key: "receiveBriefs",  minScore: COMPLETION_THRESHOLDS.receiveBriefs,  enforced: false },
      { key: "becomeVerified", minScore: COMPLETION_THRESHOLDS.becomeVerified, enforced: false },
    ];
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
