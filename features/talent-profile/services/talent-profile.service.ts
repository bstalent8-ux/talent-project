// ─── Public talent profile loading ────────────────────────────────────────────
// Phase 2 Part 2: internals now read through features/profiles repositories.
//
// Every exported signature and return type is UNCHANGED, so /talent/[handle],
// its transformer and its components are untouched. This file keeps its
// "degrade to null / empty array on failure" contract: the repositories throw,
// so each call is wrapped and the previous fallback is preserved. A public
// profile page must never 500 because one child query failed.
//
// TODO(part-3): /talent/[handle] moves to profileService.getPublicProfileByHandle
// and this whole module is deleted.

import { adminClient } from "@/lib/supabase/admin";
import { profileRepository } from "@/features/profiles/repositories/profile.repository";
import { talentRepository } from "@/features/profiles/repositories/talent.repository";
import type { RawProfile, RawPortfolioItem, BrandItem, RawReview, BookingStats } from "../types";

export async function fetchTalentByHandle(handle: string): Promise<RawProfile | null> {
  try {
    const identity = await profileRepository.findIdentityByHandle(handle);
    if (!identity) return null;

    const core = await talentRepository.findByUserId(identity.profile.id);

    // Rebuilt into the exact shape the previous embedded select returned, so
    // the transformer sees identical input.
    return {
      ...identity.profile,
      talent_profiles: core,
    } as unknown as RawProfile;
  } catch {
    return null;
  }
}

export async function fetchPortfolioByTalentId(talentProfileId: string): Promise<RawPortfolioItem[]> {
  try {
    // approvedOnly = true — the public filter this function always applied.
    return (await talentRepository.findPortfolio(talentProfileId, true)) as RawPortfolioItem[];
  } catch {
    return [];
  }
}

export async function fetchReviewsByTalentId(talentProfileId: string): Promise<RawReview[]> {
  try {
    const reviews = await talentRepository.findReviews(talentProfileId, true);
    if (!reviews.length) return [];

    // Reviewer names: brand_id → profiles.id. `profiles` is not a Class B table
    // and this batched lookup is unchanged from the previous implementation.
    const brandIds = [...new Set(reviews.map((r) => r.brand_id).filter(Boolean))];
    const { data: brandProfiles } = brandIds.length
      ? await adminClient.from("profiles").select("id, full_name").in("id", brandIds)
      : { data: [] };

    const brandMap = Object.fromEntries((brandProfiles ?? []).map((p) => [p.id, p.full_name]));

    return reviews.map((r) => ({
      ...r,
      profiles: { full_name: brandMap[r.brand_id] ?? null },
    })) as unknown as RawReview[];
  } catch {
    return [];
  }
}

export async function fetchBookingStatsByTalentId(talentProfileId: string): Promise<BookingStats> {
  try {
    // Reads bookings.talent_id, NOT provider_profile_id. Switching booking
    // reads to the shadow column is Phase 5.
    const rows = await talentRepository.findBookingStatuses(talentProfileId);
    return {
      total:     rows.length,
      completed: rows.filter((r) => r.status === "completed").length,
      pending:   rows.filter((r) => r.status === "pending").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
    };
  } catch {
    return { total: 0, completed: 0, pending: 0, cancelled: 0 };
  }
}

export async function fetchBrandsByTalentProfileId(talentProfileId: string): Promise<BrandItem[]> {
  try {
    const rows = await talentRepository.findBrands(talentProfileId);
    if (!rows.length) return [];

    return rows.map((row) => ({
      id:                row.id,
      name:              row.brand_name,
      logo_url:          row.logo_url ?? null,
      year_collaborated: row.year_collaborated ?? null,
      sort_order:        row.sort_order ?? 0,
    }));
  } catch {
    return [];
  }
}
