export const runtime = "edge";
export const dynamic = "force-dynamic";

import AdminPackagesClient from "./_components/AdminPackagesClient";
import { fetchAdminPackages, fetchPackageCategories } from "@/features/packages/services/package.service";

export default async function AdminPackagesPage() {
  const [packages, categories] = await Promise.all([
    fetchAdminPackages(),
    fetchPackageCategories(false),
  ]);

  return <AdminPackagesClient initialPackages={packages} talentTypes={categories} />;
}
