export const runtime = "edge";
export const dynamic = "force-dynamic";

import {
  fetchPackageCategories,
  fetchPublicPackagesByAudience,
  fetchTalentTypes,
  normalizeTalentTypeId,
} from "@/features/packages/services/package.service";
import PackagesClient from "./_components/PackagesClient";

export default async function PackagesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const selected = normalizeTalentTypeId(String(params.type ?? "ugc"));
  const [talentTypes, categories] = await Promise.all([
    fetchTalentTypes(true),
    fetchPackageCategories(true),
  ]);
  const initialType = categories.some((type) => type.id === selected)
    ? selected
    : talentTypes[0]?.id ?? "ugc";
  const packages = await fetchPublicPackagesByAudience(initialType);

  return (
    <PackagesClient
      initialPackages={packages}
      initialTalentType={initialType}
      categories={categories}
      talentTypes={talentTypes}
    />
  );
}
