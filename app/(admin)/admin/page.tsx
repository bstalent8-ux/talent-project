export const dynamic = "force-dynamic";

import { fetchAdminDashboardStats } from "@/features/admin/services/admin.service";
import AdminDashboardClient from "./_components/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const stats = await fetchAdminDashboardStats();
  return <AdminDashboardClient stats={stats} />;
}
