export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { fetchAdminBrandMoments } from "@/features/admin/services/admin.service";
import AdminBrandMomentsClient from "./_components/AdminBrandMomentsClient";

export default async function AdminBrandMomentsPage() {
  const moments = await fetchAdminBrandMoments();
  return <AdminBrandMomentsClient moments={moments} />;
}
