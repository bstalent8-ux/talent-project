export const runtime = "edge";

import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { fetchFreePackage, fetchPublicPackages } from "@/features/packages/services/package.service";
import PackagesClient from "./_components/PackagesClient";

export default async function PackagesPage() {
  const [packages, freePackage] = await Promise.all([
    cachedPublic(
      ["packages-public", "limit-3"],
      [CACHE_TAGS.packages.list],
      CACHE_SECONDS.oneHour,
      () => fetchPublicPackages(3),
    ),
    cachedPublic(
      ["packages-public", "free"],
      [CACHE_TAGS.packages.list],
      CACHE_SECONDS.oneHour,
      () => fetchFreePackage(),
    ),
  ]);

  return <PackagesClient initialPackages={packages} freePackage={freePackage} />;
}
