export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminTalentsShell from "./_components/AdminTalentsShell";
import TalentsTableSection from "./_components/TalentsTableSection";
import TalentsTableSkeleton from "./_components/TalentsTableSkeleton";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminTalentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = typeof sp.status === "string" ? sp.status : "all";

  return (
    <AdminTalentsShell status={status}>
      <Suspense key={`${page}-${status}`} fallback={<TalentsTableSkeleton />}>
        <TalentsTableSection page={page} pageSize={PAGE_SIZE} status={status} />
      </Suspense>
    </AdminTalentsShell>
  );
}
