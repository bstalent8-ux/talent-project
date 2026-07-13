export const dynamic = "force-dynamic";

import { fetchAdminVerifications } from "@/features/admin/services/admin.service";
import AdminVerificationsClient from "./_components/AdminVerificationsClient";

export default async function AdminVerificationsPage() {
  const verifications = await fetchAdminVerifications();
  return <AdminVerificationsClient verifications={verifications} />;
}
