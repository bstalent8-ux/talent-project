export const runtime = 'edge';

import HomeClient from "./_components/HomeClient";
import { getCachedPublicTalentCards } from "@/features/talent-profile/services/public-talents.service";
import { CACHE_SECONDS } from "@/lib/cache";

export default async function HomePage() {
  const talents = await getCachedPublicTalentCards(30, CACHE_SECONDS.tenMinutes);
  const topTalents = [...talents].sort((a, b) => b.rating - a.rating).slice(0, 6);

  return (
    <HomeClient
      topTalents={topTalents}
      totalTalents={talents.length}
    />
  );
}
