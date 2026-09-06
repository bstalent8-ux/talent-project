export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminLeadsShell from "./_components/AdminLeadsShell";
import LeadImportPanel from "./_components/LeadImportPanel";
import LeadsTableSection from "./_components/LeadsTableSection";
import LeadsTableSkeleton from "./_components/LeadsTableSkeleton";

const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_PAGE_SIZES = [10, 25, 100];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = typeof sp.status === "string" ? sp.status : "all";
  const requestedPageSize = Number(sp.pageSize);
  const pageSize = ALLOWED_PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : DEFAULT_PAGE_SIZE;

  return (
    <AdminLeadsShell status={status}>
      <LeadImportPanel />
      <Suspense key={`${page}-${status}-${pageSize}`} fallback={<LeadsTableSkeleton />}>
        <LeadsTableSection page={page} pageSize={pageSize} status={status} />
      </Suspense>
    </AdminLeadsShell>
  );
}
