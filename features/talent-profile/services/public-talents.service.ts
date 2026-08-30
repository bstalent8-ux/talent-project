import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { parsePrice } from "@/lib/price";
import { adminClient } from "@/lib/supabase/admin";
import { safePublicDisplayName } from "@/lib/public-display-name";
import { calculateCompletion, COMPLETION_THRESHOLDS } from "@/lib/profile-completion";

export interface PublicTalentCard {
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

type PublicTalentProfileRow = {
  id: string;
  category: string | null;
  specialties: string[] | null;
  avg_rating: number | null;
  total_reviews: number | null;
  packages: unknown;
  social_links: unknown;
  status?: string | null;
  bio?: string | null;
  availability?: string | null;
};

type PublicTalentProfile = {
  id: string;
  handle: string | null;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio?: string | null;
  account_status?: string | null;
  is_verified?: boolean | null;
  is_suspended?: boolean | null;
  talent_profiles: PublicTalentProfileRow | PublicTalentProfileRow[] | null;
};

// bio/availability added for the completion-score gate below — everything
// else here was already selected for card rendering.
const PUBLIC_TALENT_SELECT_ATTEMPTS = [
  {
    label: "profiles_with_account_status",
    select: `
      id, handle, full_name, avatar_url, city, bio, account_status, is_verified, is_suspended,
      talent_profiles!inner (
        id, category, specialties, avg_rating, total_reviews,
        packages, social_links, status, bio, availability
      )
    `,
    filterSuspended: true,
  },
  {
    label: "profiles_legacy_status",
    select: `
      id, handle, full_name, avatar_url, city, bio, is_verified, is_suspended,
      talent_profiles!inner (
        id, category, specialties, avg_rating, total_reviews,
        packages, social_links, status, bio, availability
      )
    `,
    filterSuspended: true,
  },
  {
    label: "profiles_minimal_status",
    select: `
      id, handle, full_name, avatar_url, city, bio, is_verified,
      talent_profiles!inner (
        id, category, specialties, avg_rating, total_reviews,
        packages, social_links, status, bio, availability
      )
    `,
    filterSuspended: false,
  },
] as const;

/**
 * A profile with no real content behind it (no photo/video, nothing filled
 * in) reads as fake to a visitor even when it's technically "approved" —
 * CLAUDE.md's COMPLETION_THRESHOLDS.appearInSearch (60) has existed since
 * the completion system shipped but was never enforced anywhere. This is
 * the first enforcement: Explore/Home simply omit anyone under it, reusing
 * the exact same scoring the talent sees on their own completion card, so
 * "why don't I show up" always has the same answer as "what's left to fill."
 */
function toPublicTalentCards(
  rows: PublicTalentProfile[],
  portfolioCountByTalentProfileId: Record<string, number>,
): PublicTalentCard[] {
  return rows.flatMap((p) => {
    const tp = Array.isArray(p.talent_profiles) ? p.talent_profiles[0] : p.talent_profiles;
    if (!tp || !p.handle) return [];
    if (p.account_status && ["blocked", "suspended", "rejected"].includes(p.account_status)) return [];
    if (tp.status && tp.status !== "approved") return [];

    const portfolioCount = portfolioCountByTalentProfileId[tp.id] ?? 0;
    const { score } = calculateCompletion(p, tp, new Array(portfolioCount).fill(null));
    if (score < COMPLETION_THRESHOLDS.appearInSearch) return [];

    const sl = (tp.social_links ?? {}) as Record<string, unknown>;
    const pkgs = Array.isArray(tp.packages) ? tp.packages as Array<Record<string, unknown>> : [];
    const prices = pkgs.map((pk) => parsePrice(pk.price)).filter((n) => n > 0);

    return [{
      id:             p.id,
      handle:         p.handle,
      name:           safePublicDisplayName(p.full_name, p.handle, "Talent"),
      avatar_url:     p.avatar_url ?? null,
      location:       p.city ?? null,
      category:       tp.category ?? null,
      specialties:    tp.specialties ?? [],
      rating:         tp.avg_rating ?? 0,
      review_count:   tp.total_reviews ?? 0,
      starting_price: prices.length > 0 ? Math.min(...prices) : null,
      verified:       Boolean(p.is_verified),
      fast_response:  Boolean(sl.fast_response),
      premium:        Boolean(sl.premium),
      gender:         (sl.gender as string) ?? null,
    }];
  });
}

/** One batched count query instead of N — see CLAUDE.md §11.10. */
async function fetchPortfolioCounts(talentProfileIds: string[]): Promise<Record<string, number>> {
  if (talentProfileIds.length === 0) return {};

  const { data, error } = await adminClient
    .from("portfolio_items")
    .select("talent_id")
    .eq("is_approved", true)
    .in("talent_id", talentProfileIds);

  if (error) {
    console.error("[public-talents] portfolio count query failed", error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of (data as { talent_id: string }[]) ?? []) {
    counts[row.talent_id] = (counts[row.talent_id] ?? 0) + 1;
  }
  return counts;
}

async function queryPublicTalentRows(limit?: number): Promise<PublicTalentProfile[]> {
  let lastError: unknown = null;

  for (const attempt of PUBLIC_TALENT_SELECT_ATTEMPTS) {
    let query = adminClient
      .from("profiles")
      .select(attempt.select)
      .eq("role", "talent")
      .not("handle", "is", null)
      .eq("talent_profiles.status", "approved");

    if (attempt.filterSuspended) query = query.eq("is_suspended", false);
    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (process.env.DEBUG_CACHE === "1") {
      console.info("[cache:talents:list]", {
        attempt: attempt.label,
        limit: limit ?? null,
        returned_count: data?.length ?? 0,
        error: error ? { code: error.code, message: error.message } : null,
      });
    }

    if (!error) return (data ?? []) as unknown as PublicTalentProfile[];

    lastError = error;
    if (error.code !== "42703") break;
  }

  console.error("[cache:talents:list] failed", lastError);
  return [];
}

export async function fetchPublicTalentCards(limit?: number): Promise<PublicTalentCard[]> {
  const rows = await queryPublicTalentRows(limit);

  const talentProfileIds = rows.flatMap((p) => {
    const tp = Array.isArray(p.talent_profiles) ? p.talent_profiles[0] : p.talent_profiles;
    return tp?.id ? [tp.id] : [];
  });
  const portfolioCounts = await fetchPortfolioCounts(talentProfileIds);

  return toPublicTalentCards(rows, portfolioCounts);
}

export async function getCachedPublicTalentCards(
  limit?: number,
  revalidate: number = CACHE_SECONDS.fiveMinutes,
): Promise<PublicTalentCard[]> {
  return cachedPublic(
    ["public-talents", String(limit ?? "all"), String(revalidate)],
    [CACHE_TAGS.talents.list, CACHE_TAGS.home.public],
    revalidate,
    () => fetchPublicTalentCards(limit),
  );
}
