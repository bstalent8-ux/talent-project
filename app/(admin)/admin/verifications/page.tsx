export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminVerificationsShell from "./_components/AdminVerificationsShell";
import VerificationsTableSection from "./_components/VerificationsTableSection";
import VerificationsTableSkeleton from "./_components/VerificationsTableSkeleton";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminVerificationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  // Matches the old client default (pending requests first) rather than "all".
  const status = typeof sp.status === "string" ? sp.status : "pending";

  return (
    <AdminVerificationsShell status={status}>
      <Suspense key={`${page}-${status}`} fallback={<VerificationsTableSkeleton />}>
        <VerificationsTableSection page={page} pageSize={PAGE_SIZE} status={status} />
      </Suspense>
    </AdminVerificationsShell>
  );
}
