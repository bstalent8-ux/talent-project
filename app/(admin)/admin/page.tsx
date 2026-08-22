export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminDashboardShell from "./_components/AdminDashboardShell";
import DashboardStatsSection from "./_components/DashboardStatsSection";
import DashboardStatsSkeleton from "./_components/DashboardStatsSkeleton";

export default function AdminDashboardPage() {
  return (
    <AdminDashboardShell>
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStatsSection />
      </Suspense>
    </AdminDashboardShell>
  );
}
