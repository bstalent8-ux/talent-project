export const dynamic = "force-dynamic";

import { fetchAdminReviews } from "@/features/admin/services/admin.service";
import AdminReviewsClient from "./_components/AdminReviewsClient";

export default async function AdminReviewsPage() {
  const reviews = await fetchAdminReviews();
  return <AdminReviewsClient reviews={reviews} />;
}
