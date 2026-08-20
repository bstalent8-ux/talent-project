export const runtime = 'edge';

import HomeClient from "./_components/HomeClient";
import { getCachedPublicTalentCards } from "@/features/talent-profile/services/public-talents.service";
import {
  getCachedApprovedTestimonials,
  getCachedApprovedBrandMoments,
  getCachedCompletedProjectsCount,
} from "@/features/landing/services/landing-content.service";
import { CACHE_SECONDS } from "@/lib/cache";

export default async function HomePage() {
  // Unlimited (was capped at 30) — categoryCounts/avgRating/totalTalents
  // need the real full count, not a truncated sample.
  const [talents, testimonials, brandMoments, completedProjects] = await Promise.all([
    getCachedPublicTalentCards(undefined, CACHE_SECONDS.tenMinutes),
    getCachedApprovedTestimonials(),
    getCachedApprovedBrandMoments(),
    getCachedCompletedProjectsCount(),
  ]);

  const topTalents = [...talents].sort((a, b) => b.rating - a.rating).slice(0, 6);

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
      topTalents={topTalents}
      totalTalents={talents.length}
      completedProjects={completedProjects}
      avgRating={avgRating}
      categoryCounts={categoryCounts}
      testimonials={testimonials}
      brandMoments={brandMoments}
    />
  );
}
