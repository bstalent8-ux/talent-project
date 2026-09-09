export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminDashboardShell from "./_components/AdminDashboardShell";
import DashboardStatsSection from "./_components/DashboardStatsSection";
import DashboardStatsSkeleton from "./_components/DashboardStatsSkeleton";
import IncompleteSignupsSection from "./_components/IncompleteSignupsSection";
import IncompleteSignupsSkeleton from "./_components/IncompleteSignupsSkeleton";
import NewMediaUploadsSection from "./_components/NewMediaUploadsSection";
import NewMediaUploadsSkeleton from "./_components/NewMediaUploadsSkeleton";
import BioPhoneAlertsSection from "./_components/BioPhoneAlertsSection";
import BioPhoneAlertsSkeleton from "./_components/BioPhoneAlertsSkeleton";

export default function AdminDashboardPage() {
  return (
    <AdminDashboardShell>
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStatsSection />
      </Suspense>
      <Suspense fallback={<IncompleteSignupsSkeleton />}>
        <IncompleteSignupsSection />
      </Suspense>
      <Suspense fallback={<NewMediaUploadsSkeleton />}>
        <NewMediaUploadsSection />
      </Suspense>
      <Suspense fallback={<BioPhoneAlertsSkeleton />}>
        <BioPhoneAlertsSection />
      </Suspense>
    </AdminDashboardShell>
  );
}
