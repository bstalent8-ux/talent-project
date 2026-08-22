export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminBrandMomentsShell from "./_components/AdminBrandMomentsShell";
import BrandMomentsSection from "./_components/BrandMomentsSection";
import BrandMomentsSkeleton from "./_components/BrandMomentsSkeleton";

export default function AdminBrandMomentsPage() {
  return (
    <AdminBrandMomentsShell>
      <Suspense fallback={<BrandMomentsSkeleton />}>
        <BrandMomentsSection />
      </Suspense>
    </AdminBrandMomentsShell>
  );
}
