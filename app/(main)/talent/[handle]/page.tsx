export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
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

  const profile = await fetchTalentByHandle(handle);
  if (!profile) notFound();

  const tp = Array.isArray(profile.talent_profiles)
    ? profile.talent_profiles[0]
    : profile.talent_profiles;

  if (!tp) notFound();

  const [rawPortfolio, rawReviews, bookingStats, dbBrands] = await Promise.all([
    tp?.id ? fetchPortfolioByTalentId(tp.id)        : Promise.resolve([]),
    tp?.id ? fetchReviewsByTalentId(tp.id)           : Promise.resolve([]),
    tp?.id ? fetchBookingStatsByTalentId(tp.id)      : Promise.resolve({ total: 0, completed: 0, pending: 0, cancelled: 0 }),
    tp?.id ? fetchBrandsByTalentProfileId(tp.id)     : Promise.resolve([]),
  ]);

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