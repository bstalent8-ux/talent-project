// Shared by app/api/favorites/route.ts (client refetch after remove) and
// app/(main)/favorites/page.tsx (server-rendered initial list) so the two
// call sites can never drift on the public-gate filters (approved listing,
// not blocked/suspended — same rule public-talents.service.ts applies).

import { adminClient } from "@/lib/supabase/admin";
import { parsePrice } from "@/lib/price";

export interface FavoriteTalentCard {
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
  availability: string | null;
  favorited_at: string;
}

export async function getFavoriteTalentCards(userId: string): Promise<FavoriteTalentCard[]> {
  const { data: favRows, error: favError } = await adminClient
    .from("favorites")
    .select("talent_user_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (favError) throw new Error(favError.message);
  if (!favRows || favRows.length === 0) return [];

  const favoritedAt = new Map(favRows.map((r) => [r.talent_user_id, r.created_at]));
  const ids = favRows.map((r) => r.talent_user_id);

  const { data: rows, error } = await adminClient
    .from("profiles")
    .select(`
      id, handle, full_name, avatar_url, city, account_status, is_verified, is_suspended,
      talent_profiles!inner (
        id, category, specialties, avg_rating, total_reviews,
        packages, availability, status
      )
    `)
    .in("id", ids);

  if (error) throw new Error(error.message);

  const data: FavoriteTalentCard[] = (rows ?? []).flatMap((p: any) => {
    const tp = Array.isArray(p.talent_profiles) ? p.talent_profiles[0] : p.talent_profiles;
    if (!tp || !p.handle) return [];
    if (p.account_status && ["blocked", "suspended", "rejected"].includes(p.account_status)) return [];
    if (p.is_suspended) return [];
    if (tp.status && tp.status !== "approved") return [];

    const pkgs = Array.isArray(tp.packages) ? (tp.packages as Array<Record<string, unknown>>) : [];
    const prices = pkgs.map((pk) => parsePrice(pk.price)).filter((n) => n > 0);

    return [{
      id:             p.id as string,
      handle:         p.handle as string,
      name:           (p.full_name as string) ?? "-",
      avatar_url:     (p.avatar_url as string) ?? null,
      location:       (p.city as string) ?? null,
      category:       tp.category ?? null,
      specialties:    tp.specialties ?? [],
      rating:         tp.avg_rating ?? 0,
      review_count:   tp.total_reviews ?? 0,
      starting_price: prices.length > 0 ? Math.min(...prices) : null,
      verified:       Boolean(p.is_verified),
      availability:   tp.availability ?? null,
      favorited_at:   favoritedAt.get(p.id) ?? new Date().toISOString(),
    }];
  });

  return data.sort((a, b) => (a.favorited_at < b.favorited_at ? 1 : -1));
}
