// ─── PublicProfileDTO → TalentProfileContext ──────────────────────────────────
// PURE. No React.
//
// The dynamic renderer receives a PublicProfileDTO from ProfileService, but the
// existing talent components expect the shapes in features/talent-profile/types.
// This is the single mapping between them.
//
// Field derivation mirrors features/talent-profile/transformers exactly, so a
// profile rendered through the dynamic path shows the same values as today.

import type { PublicProfileDTO, TalentPublicCore } from "@/features/profiles/types/dto";
import type {
  AddonItem,
  PackageItem,
  PortfolioItem,
  Review,
  TalentData,
} from "@/features/talent-profile/types";
import type { TalentProfileContext } from "./types";

/** Same rule as the existing transformer's formatViews(). */
function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${Math.round(views / 1_000)}K`;
  return String(views);
}

export function toTalentData(dto: PublicProfileDTO): TalentData {
  const core = dto.core as TalentPublicCore;
  const social = (core.socialLinks ?? {}) as Record<string, unknown>;
  const identity = dto.identity;

  return {
    id:          identity.id,
    name:        identity.fullName ?? "Talent",
    handle:      identity.handle ?? "",
    avatarUrl:   identity.avatarUrl ?? null,
    title:       (social.title as string) ?? core.category ?? "",
    // Matches transformTalentData: city + fixed country, with the same default.
    location:    identity.city ? `${identity.city}، مصر` : "القاهرة، مصر",
    memberSince: (social.member_since as string) ?? identity.createdAt?.slice(0, 4) ?? "2022",
    rating:       core.rating ?? 0,
    reviewCount:  core.reviewCount ?? 0,
    views:       (social.views_display as string) ?? formatViews(0),
    verified:     Boolean(identity.isVerified),
    fastResponse: Boolean(social.fast_response),
    premium:      Boolean(social.premium),
    bio:          identity.bio ?? null,
    specialties:  core.specialties ?? [],
    category:     core.category ?? null,
  };
}

export function toPortfolioItems(dto: PublicProfileDTO): PortfolioItem[] {
  const core = dto.core as TalentPublicCore;
  return (core.portfolio ?? []).map((item) => ({
    id:         item.id,
    url:        item.url,
    media_type: item.mediaType,
    caption:    item.caption,
    sort_order: item.sortOrder,
  }));
}

export function toPackages(dto: PublicProfileDTO): PackageItem[] | null {
  const core = dto.core as TalentPublicCore;
  const packages = core.packages ?? [];
  return packages.length > 0 ? packages : null;
}

/**
 * Add-ons still live in the social_links JSONB blob, so they are read from
 * there rather than from a typed column. Decomposing that blob is Phase 4 of
 * the architecture plan; until then this mirrors transformAddons().
 */
export function toAddons(dto: PublicProfileDTO): AddonItem[] | null {
  const core = dto.core as TalentPublicCore;
  const raw = (core.socialLinks ?? {})["usage_addons"];
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const parsed: AddonItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (!row.label) continue;
    parsed.push({
      key:   String(row.key ?? row.label),
      label: String(row.label),
      price: Number(row.price ?? 0),
    });
  }
  return parsed.length > 0 ? parsed : null;
}

export function toReviews(dto: PublicProfileDTO, locale = "ar-EG"): Review[] {
  const core = dto.core as TalentPublicCore;
  return (core.reviews ?? []).map((review) => ({
    id:     review.id,
    author: review.author,
    brand:  "",
    rating: review.rating,
    text:   review.text,
    date:   new Date(review.createdAt).toLocaleDateString(locale, {
      month: "long",
      year:  "numeric",
    }),
  }));
}

export interface TalentContextHandlers {
  selectedPackage: PackageItem | null;
  onSelectPackage: (pkg: PackageItem) => void;
}

/**
 * Builds the adapter context from a real DTO plus the caller's lifted state.
 *
 * `selectedPackage` / `onSelectPackage` are NOT derived from the DTO — they are
 * interaction state owned by DynamicProfileProvider, exactly as
 * TalentModelProfile owns them today (its line 70).
 */
export function buildTalentContextFromDTO(
  dto: PublicProfileDTO,
  handlers: TalentContextHandlers,
): TalentProfileContext {
  return {
    typeSlug:        "talent",
    talent:          toTalentData(dto),
    portfolioItems:  toPortfolioItems(dto),
    packages:        toPackages(dto),
    addons:          toAddons(dto),
    reviews:         toReviews(dto),
    selectedPackage: handlers.selectedPackage,
    onSelectPackage: handlers.onSelectPackage,
  };
}
