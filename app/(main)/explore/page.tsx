export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { adminClient } from "@/lib/supabase/admin";
import { getCachedUser } from "@/lib/supabase/server";
import { normalizeCategoryId } from "@/features/categories/matching";
import { parsePrice } from "@/lib/price";
import ExploreClient from "./_components/ExploreClient";

export interface TalentCard {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  location: string | null;
  category: string | null;
  specialties: string[];
  rating: number;
  review_count: number;
  starting_price: number | null;
  verified: boolean;
  fast_response: boolean;
  premium: boolean;
  gender?: string | null;
}

type ExploreTalentProfileRow = {
  id: string;
  category: string | null;
  specialties: string[] | null;
  avg_rating: number | null;
  total_reviews: number | null;
  packages: unknown;
  social_links: unknown;
  status?: string | null;
};

type ExploreProfileRow = {
  id: string;
  handle: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  account_status?: string | null;
  is_verified?: boolean | null;
  is_suspended?: boolean | null;
  talent_profiles: ExploreTalentProfileRow | ExploreTalentProfileRow[] | null;
};

const EXPLORE_DEBUG = process.env.DEBUG_EXPLORE === "1" || process.env.NODE_ENV === "development";

const EXPLORE_QUERY_ATTEMPTS = [
  {
    label: "profiles_with_account_status",
    select: `
      id, handle, full_name, avatar_url, city, account_status, is_verified, is_suspended,
      talent_profiles!inner (
        id, category, specialties, avg_rating, total_reviews,
        packages, social_links, status
      )
    `,
    filterSuspended: true,
  },
  {
    label: "profiles_legacy_status",
    select: `
      id, handle, full_name, avatar_url, city, is_verified, is_suspended,
      talent_profiles!inner (
        id, category, specialties, avg_rating, total_reviews,
        packages, social_links, status
      )
    `,
    filterSuspended: true,
  },
  {
    label: "profiles_minimal_status",
    select: `
      id, handle, full_name, avatar_url, city, is_verified,
      talent_profiles!inner (
        id, category, specialties, avg_rating, total_reviews,
        packages, social_links, status
      )
    `,
    filterSuspended: false,
  },
] as const;

async function fetchExploreProfiles(): Promise<ExploreProfileRow[]> {
  let lastError: unknown = null;

  for (const attempt of EXPLORE_QUERY_ATTEMPTS) {
    let query = adminClient
      .from("profiles")
      .select(attempt.select)
      .eq("role", "talent")
      .not("handle", "is", null)
      .eq("talent_profiles.status", "approved");

    if (attempt.filterSuspended) {
      query = query.eq("is_suspended", false);
    }

    const { data, error } = await query;

    if (EXPLORE_DEBUG) {
      console.info("[explore] query", {
        attempt: attempt.label,
        table: "profiles",
        embed: "talent_profiles!inner",
        filters: {
          role: "talent",
          handle: "not null",
          talent_profile_status: "approved",
          is_suspended: attempt.filterSuspended ? false : "not applied",
        },
        returned_count: data?.length ?? 0,
        error: error ? { code: error.code, message: error.message } : null,
      });
    }

    if (!error) {
      return (data ?? []) as unknown as ExploreProfileRow[];
    }

    lastError = error;

    // Keep Explore compatible with live MVP databases that have not received
    // every idempotent status migration yet.
    if (error.code !== "42703") break;
  }

  console.error("[explore] failed to fetch talents", lastError);
  return [];
}

/**
 * Category of the brand currently viewing Explore, normalized to a category id.
 * Returns null for guests, talents, admins, and brands with no category set —
 * in which case Explore keeps its default ranking. Every failure path is
 * non-fatal: ranking personalization must never break the page.
 *
 * Role and category are read in a single embedded select: Explore is rendered
 * against a remote Supabase, so every extra round trip is ~250ms of TTFB.
 */
async function getViewerBrandCategory(): Promise<string | null> {
  try {
    const user = await getCachedUser();
    if (!user) return null;

    const { data: profile } = await adminClient
      .from("profiles")
      // The FK must be named: brand_profiles points at profiles twice
      // (`user_id` and `approved_by`), so a bare embed is ambiguous.
      .select("role, brand_profiles!brand_profiles_user_id_fkey ( category_id, industry )")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "brand") return null;

    const bp = Array.isArray(profile.brand_profiles)
      ? profile.brand_profiles[0]
      : profile.brand_profiles;

    return normalizeCategoryId(bp?.category_id ?? bp?.industry) || null;
  } catch {
    return null;
  }
}

export default async function ExplorePage() {
  // Independent queries — resolved together so personalization costs no extra TTFB.
  const [viewerBrandCategory, rows] = await Promise.all([
    getViewerBrandCategory(),
    fetchExploreProfiles(),
  ]);

  const talents: TalentCard[] = rows.flatMap((p) => {
    const tp = Array.isArray(p.talent_profiles)
      ? p.talent_profiles[0]
      : p.talent_profiles;
    if (!tp) return [];
    if (p.account_status && ["blocked", "suspended", "rejected"].includes(p.account_status)) return [];
    if (tp.status && tp.status !== "approved") return [];

    const sl = (tp.social_links ?? {}) as Record<string, unknown>;
    const pkgs = Array.isArray(tp.packages) ? tp.packages as Array<Record<string, unknown>> : [];
    const prices = pkgs.map(pk => parsePrice(pk.price)).filter(n => n > 0);
    const startingPrice = prices.length > 0 ? Math.min(...prices) : null;

    return [{
      id: p.id,
      handle: p.handle!,
      name: p.full_name ?? "—",
      avatar_url: p.avatar_url ?? null,
      location: p.city ?? null,
      category: tp.category ?? null,
      specialties: tp.specialties ?? [],
      rating: tp.avg_rating ?? 0,
      review_count: tp.total_reviews ?? 0,
      starting_price: startingPrice,
      verified: Boolean((p as Record<string, unknown>).is_verified),
      fast_response: Boolean(sl.fast_response),
      premium: Boolean(sl.premium),
      gender: (sl.gender as string) ?? null,
    }];
  });

  return <ExploreClient talents={talents} viewerBrandCategory={viewerBrandCategory} />;
}
