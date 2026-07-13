export const dynamic = "force-dynamic";

import { adminClient } from "@/lib/supabase/admin";
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

export default async function ExplorePage() {
  const { data } = await adminClient
    .from("profiles")
    .select(`
      id, handle, full_name, avatar_url, city, is_verified, is_suspended,
      talent_profiles (
        id, category, specialties, avg_rating, total_reviews,
        packages, social_links
      )
    `)
    .eq("role", "talent")
    .eq("is_suspended", false)
    .not("handle", "is", null);

  const talents: TalentCard[] = (data ?? []).flatMap((p) => {
    const tp = Array.isArray(p.talent_profiles)
      ? p.talent_profiles[0]
      : p.talent_profiles;
    if (!tp) return [];

    const sl = (tp.social_links ?? {}) as Record<string, unknown>;
    const pkgs = Array.isArray(tp.packages) ? tp.packages as Array<Record<string, unknown>> : [];
    const startingPrice = pkgs.length > 0
      ? Math.min(...pkgs.map(pk => parseInt(String(pk.price ?? "0").replace(/[^\d]/g, ""), 10) || 0).filter(n => n > 0))
      : null;

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

  return <ExploreClient talents={talents} />;
}
