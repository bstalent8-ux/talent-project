import { fetchAdminBrandMoments } from "@/features/admin/services/admin.service";
import AdminBrandMomentsClient from "./AdminBrandMomentsClient";

// Async Server Component — the only part of the page that suspends.
// Brand moments are admin-curated content (small dataset), so no pagination
// is needed — just a loading state for the fetch itself.
export default async function BrandMomentsSection() {
  const moments = await fetchAdminBrandMoments();
  return <AdminBrandMomentsClient moments={moments} />;
}
