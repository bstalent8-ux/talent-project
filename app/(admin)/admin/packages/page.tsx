export const runtime = "edge";
export const dynamic = "force-dynamic";

import AdminPackagesClient from "./_components/AdminPackagesClient";
import { fetchAdminPackages, fetchTalentTypes } from "@/features/packages/services/package.service";

export default async function AdminPackagesPage() {
  const [packages, talentTypes] = await Promise.all([
    fetchAdminPackages(),
    fetchTalentTypes(false),
  ]);

  return <AdminPackagesClient initialPackages={packages} talentTypes={talentTypes} />;
}
