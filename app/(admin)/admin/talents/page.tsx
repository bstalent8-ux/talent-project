export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminTalentsShell from "./_components/AdminTalentsShell";
import TalentsTableSection from "./_components/TalentsTableSection";
import TalentsTableSkeleton from "./_components/TalentsTableSkeleton";

const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_PAGE_SIZES = [10, 25, 100];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminTalentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = typeof sp.status === "string" ? sp.status : "all";
  const requestedPageSize = Number(sp.pageSize);
  const pageSize = ALLOWED_PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : DEFAULT_PAGE_SIZE;

  return (
    <AdminTalentsShell status={status}>
      <Suspense key={`${page}-${status}-${pageSize}`} fallback={<TalentsTableSkeleton />}>
        <TalentsTableSection page={page} pageSize={pageSize} status={status} />
      </Suspense>
    </AdminTalentsShell>
  );
}
