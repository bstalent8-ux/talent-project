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
import { MODEL_PHYSICAL_FIELDS, TALENT_SOCIAL_KEYS } from "@/lib/profile-fields";
import { parseAvailabilitySchedule } from "@/lib/availability-schedule";
import type {
  AddonItem,
  BookingStats,
  BrandItem,
  CampaignStats,
  ExperienceItem,
  FeaturedCampaign,
  PackageItem,
  PortfolioItem,
  Review,
  TalentData,
} from "@/features/talent-profile/types";
import type { TalentProfileContext } from "./types";

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
    // `core.views` is already formatted by the provider (TalentPublicCore.views).
    // Reading it here — rather than re-formatting 0 — is what makes the dynamic
    // path show the same view count the legacy transformer shows.
    views:       (social.views_display as string) ?? core.views ?? "0",
    verified:     Boolean(identity.isVerified),
    fastResponse: Boolean(social.fast_response),
    premium:      Boolean(social.premium),
    bio:          identity.bio ?? null,
    specialties:  core.specialties ?? [],
    category:     core.category ?? null,
    availability: core.availability ?? null,
    availabilitySchedule: parseAvailabilitySchedule(core.availabilitySchedule),
    languages:    typeof social.languages === "string" && social.languages.trim().length > 0
      ? social.languages.trim()
      : null,
    // Reuses toMeasurements() below rather than re-deriving — same 5-field
    // allowlist, same category==="model" gate, single source of truth so the
    // Hero's copy and the (now-removed-for-model) sidebar card, if any
    // caller still renders it, can never disagree.
    measurements: toMeasurements(dto),
    identityVerified: Boolean(core.identityVerified),
  };
}

/** Only platforms the talent actually filled — never a full 8-key object with blanks. */
export function toPresenceLinks(dto: PublicProfileDTO): Record<string, string> {
  const core = dto.core as TalentPublicCore;
  const links = (core.socialLinks ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of TALENT_SOCIAL_KEYS) {
    const value = links[key];
    if (typeof value === "string" && value.trim().length > 2) out[key] = value.trim();
  }
  return out;
}

/**
 * Null unless category is "model" (or the legacy "fashion" value that
 * ModelProfileShell also renders — see talent/[handle]/page.tsx) AND at
 * least one of the 5 approved fields is filled. For "model" this mirrors
 * section-content.ts's `physical` rule exactly; "fashion" never goes
 * through that gate since it bypasses DynamicProfileRenderer entirely.
 */
export function toMeasurements(dto: PublicProfileDTO): Record<string, string> | null {
  const core = dto.core as TalentPublicCore;
  if (core.category !== "model" && core.category !== "fashion") return null;
  const links = (core.socialLinks ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of MODEL_PHYSICAL_FIELDS) {
    const value = links[key];
    if (typeof value === "string" && value.trim().length > 0) out[key] = value.trim();
  }
  return Object.keys(out).length > 0 ? out : null;
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

/** Mirrors transformExperience() — entries still live in the social_links blob. */
export function toExperience(dto: PublicProfileDTO): ExperienceItem[] | null {
  const core = dto.core as TalentPublicCore;
  const raw = (core.socialLinks ?? {})["experience"];
  if (!Array.isArray(raw)) return null;

  return (raw as Array<Record<string, unknown>>).map((entry) => ({
    name:     String(entry?.name ?? ""),
    year:     String(entry?.year ?? ""),
    verified: Boolean(entry?.verified),
  }));
}

/**
 * Brands come from the typed `talent_brands` table (core.brands), never from the
 * legacy `social_links.brands` fallback — that migration is already done.
 */
export function toBrandItems(dto: PublicProfileDTO): BrandItem[] {
  const core = dto.core as TalentPublicCore;
  return (core.brands ?? []).map((brand) => ({
    id:                brand.id,
    name:              brand.name,
    logo_url:          brand.logoUrl,
    year_collaborated: brand.yearCollaborated,
    sort_order:        brand.sortOrder,
    verified:          brand.verified,
  }));
}

export function toBookingStats(dto: PublicProfileDTO): BookingStats {
  const core = dto.core as TalentPublicCore;
  return core.bookingStats ?? { total: 0, completed: 0, pending: 0, cancelled: 0 };
}

/**
 * Campaign copy is page CHROME, not a section — CampaignBanner renders above the
 * layout slots. It still belongs here because the blob it reads is only reachable
 * through the DTO, and mirroring transformCampaignStats() keeps the two paths
 * showing identical numbers.
 */
export function toCampaignStats(dto: PublicProfileDTO): CampaignStats | null {
  const raw = (dto.core as TalentPublicCore).socialLinks?.["campaign_stats"] as
    | Record<string, string>
    | undefined;
  if (!raw) return null;
  return {
    views:          raw.views          ?? "—",
    ctr:            raw.ctr            ?? "—",
    sales_increase: raw.sales_increase ?? "—",
    repeat:         raw.repeat         ?? "—",
  };
}

/** Mirrors transformFeaturedCampaign(). */
export function toFeaturedCampaign(dto: PublicProfileDTO): FeaturedCampaign | null {
  const raw = (dto.core as TalentPublicCore).socialLinks?.["featured_campaign"] as
    | Record<string, string>
    | undefined;
  if (!raw) return null;
  return {
    name:       raw.name       ?? "—",
    ctr_before: raw.ctr_before ?? "—",
    ctr_after:  raw.ctr_after  ?? "—",
    growth:     raw.growth     ?? "—",
  };
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
    experience:      toExperience(dto),
    brands:          toBrandItems(dto),
    bookingStats:    toBookingStats(dto),
    selectedPackage: handlers.selectedPackage,
    onSelectPackage: handlers.onSelectPackage,
    presenceLinks:   toPresenceLinks(dto),
    measurements:    toMeasurements(dto),
  };
}
