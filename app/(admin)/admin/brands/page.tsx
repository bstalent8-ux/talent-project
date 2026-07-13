export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { fetchAdminBrands } from "@/features/admin/services/admin.service";
import AdminBrandsClient from "./_components/AdminBrandsClient";

export default async function AdminBrandsPage() {
  const brands = await fetchAdminBrands();
  return <AdminBrandsClient brands={brands} />;
}