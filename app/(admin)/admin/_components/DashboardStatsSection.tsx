import { fetchAdminDashboardStats } from "@/features/admin/services/admin.service";
import DashboardStatsGrid from "./DashboardStatsGrid";

// Async Server Component — the only part of the dashboard that suspends.
export default async function DashboardStatsSection() {
  const stats = await fetchAdminDashboardStats();
  return <DashboardStatsGrid stats={stats} />;
}
