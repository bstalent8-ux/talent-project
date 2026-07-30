export const runtime = "edge";

import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { fetchPublicPackages } from "@/features/packages/services/package.service";
import PackagesClient from "./_components/PackagesClient";

export default async function PackagesPage() {
  const packages = await cachedPublic(
    ["packages-public", "limit-3"],
    [CACHE_TAGS.packages.list],
    CACHE_SECONDS.oneHour,
    () => fetchPublicPackages(3),
  );

  return <PackagesClient initialPackages={packages} />;
}
