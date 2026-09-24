export const runtime = 'edge';

import HomeClient from "./_components/HomeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talents — Book Verified UGC Creators & Models",
  description: "Talents connects brands with manually reviewed UGC creators and models in Egypt and the Arab world.",
  alternates: { canonical: "/home" },
};
import { getCachedPublicTalentCards } from "@/features/talent-profile/services/public-talents.service";
import {
  getCachedCompletedProjectsCount,
  getCachedPublicBrandCount,
  getCachedCommunityHighlights,
  getCachedFeaturedPackages,
} from "@/features/landing/services/landing-content.service";
import { CACHE_SECONDS } from "@/lib/cache";

export default async function HomePage() {
  // Unlimited (was capped at 30) — categoryCounts/avgRating/totalTalents
  // need the real full count, not a truncated sample.
  const [talents, completedProjects, brandCount, community, packages] = await Promise.all([
    getCachedPublicTalentCards(undefined, CACHE_SECONDS.tenMinutes),
    getCachedCompletedProjectsCount(),
    getCachedPublicBrandCount(),
    getCachedCommunityHighlights(),
    getCachedFeaturedPackages(),
  ]);

  const categoryCounts = { ugc: 0, model: 0 };
  let ratingSum = 0;
  let ratingCount = 0;
  for (const t of talents) {
    const cat = (t.category ?? "").toLowerCase();
    if (cat === "ugc" || cat === "model") categoryCounts[cat] += 1;
    if (t.rating > 0) {
      ratingSum += t.rating;
      ratingCount += 1;
    }
  }
  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

  return (
    <HomeClient
      totalTalents={talents.length}
      brandCount={brandCount}
      completedProjects={completedProjects}
      avgRating={avgRating}
      categoryCounts={categoryCounts}
      community={community}
      packages={packages}
    />
  );
}
