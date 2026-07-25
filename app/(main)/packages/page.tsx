export const runtime = "edge";
export const dynamic = "force-dynamic";

import { fetchPublicPackages } from "@/features/packages/services/package.service";
import PackagesClient from "./_components/PackagesClient";

export default async function PackagesPage() {
  const packages = await fetchPublicPackages(3);

  return <PackagesClient initialPackages={packages} />;
}
