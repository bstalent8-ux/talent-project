export const dynamic = "force-dynamic";

import { adminClient } from "@/lib/supabase/admin";
import HomeClient from "./_components/HomeClient";
import type { TalentCard } from "../explore/page";

export default async function HomePage() {
  const { data } = await adminClient
    .from("profiles")
    .select(`
      id, handle, full_name, avatar_url, city, is_verified, is_suspended,
      talent_profiles (
        id, category, specialties, avg_rating, total_reviews, packages, social_links
      )
    `)
    .eq("role", "talent")
    .eq("is_suspended", false)
    .not("handle", "is", null)
    .limit(30);

  const talents: TalentCard[] = (data ?? []).flatMap((p) => {
    const tp = Array.isArray(p.talent_profiles) ? p.talent_profiles[0] : p.talent_profiles;
    if (!tp) return [];
    const sl = (tp.social_links ?? {}) as Record<string, unknown>;
    const pkgs = Array.isArray(tp.packages) ? tp.packages as Array<Record<string, unknown>> : [];
    const startingPrice = pkgs.length > 0
      ? Math.min(...pkgs.map(pk => parseInt(String(pk.price ?? "0").replace(/[^\d]/g, ""), 10) || 0).filter(n => n > 0))
      : null;
    return [{
      id: p.id, handle: p.handle!, name: p.full_name ?? "—",
      avatar_url: p.avatar_url ?? null, location: p.city ?? null,
      category: tp.category ?? null, specialties: tp.specialties ?? [],
      rating: tp.avg_rating ?? 0, review_count: tp.total_reviews ?? 0,
      starting_price: startingPrice,
      verified: Boolean((p as Record<string, unknown>).is_verified),
      fast_response: Boolean(sl.fast_response),
      premium: Boolean(sl.premium),
      gender: (sl.gender as string) ?? null,
    }];
  });

  const topTalents = [...talents].sort((a, b) => b.rating - a.rating).slice(0, 6);

  return <HomeClient topTalents={topTalents} totalTalents={talents.length} />;
}
