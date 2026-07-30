export const runtime = 'edge';

import { notFound } from "next/navigation";
import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import {
  fetchTalentByHandle,
  fetchPortfolioByTalentId,
  fetchReviewsByTalentId,
  fetchBookingStatsByTalentId,
  fetchBrandsByTalentProfileId,
} from "@/features/talent-profile/services/talent-profile.service";
import { transformTalentPageData } from "@/features/talent-profile/transformers/talent-profile.transformer";
import TalentModelProfile from "./_components/TalentModelProfile";

export default async function TalentPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  const payload = await cachedPublic(
    ["talent-detail", handle],
    [CACHE_TAGS.talents.detail(handle), CACHE_TAGS.talents.list],
    CACHE_SECONDS.tenMinutes,
    async () => {
      const profile = await fetchTalentByHandle(handle);
      if (!profile) return null;

      const tp = Array.isArray(profile.talent_profiles)
        ? profile.talent_profiles[0]
        : profile.talent_profiles;

      if (!tp) return null;
      if ((profile as any).account_status && ["blocked", "suspended", "rejected"].includes((profile as any).account_status)) return null;
      if (tp.status && tp.status !== "approved") return null;

      const [rawPortfolio, rawReviews, bookingStats, dbBrands] = await Promise.all([
        tp.id ? fetchPortfolioByTalentId(tp.id)        : Promise.resolve([]),
        tp.id ? fetchReviewsByTalentId(tp.id)          : Promise.resolve([]),
        tp.id ? fetchBookingStatsByTalentId(tp.id)     : Promise.resolve({ total: 0, completed: 0, pending: 0, cancelled: 0 }),
        tp.id ? fetchBrandsByTalentProfileId(tp.id)    : Promise.resolve([]),
      ]);

      return { profile, tp, rawPortfolio, rawReviews, bookingStats, dbBrands };
    },
  );

  if (!payload) notFound();

  const { profile, tp, rawPortfolio, rawReviews, bookingStats, dbBrands } = payload;
  if (!profile) notFound();

  const data = transformTalentPageData(profile, tp ?? null, rawPortfolio, rawReviews);
  // Prefer DB brands (talent_brands table); fall back to social_links.brands
  const brands = dbBrands.length > 0 ? dbBrands : data.brands;

  return (
    <TalentModelProfile
      talent={data.talent}
      brands={brands}
      reviews={data.reviews}
      experience={data.experience}
      packages={data.packages}
      addons={data.addons}
      portfolioItems={data.portfolioItems}
      campaignStats={data.campaignStats}
      featuredCampaign={data.featuredCampaign}
      bookingStats={bookingStats}
    />
  );
}
