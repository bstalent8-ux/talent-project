export const runtime = "edge";
export const dynamic = "force-dynamic";

import AdminTrustedBrandsClient from "./_components/AdminTrustedBrandsClient";
import { fetchAdminTrustedBrands } from "@/features/trusted-brands/trusted-brands.service";

export default async function AdminTrustedBrandsPage() {
  const brands = await fetchAdminTrustedBrands();
  return <AdminTrustedBrandsClient initialBrands={brands} />;
}
