export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminBrandsShell from "./_components/AdminBrandsShell";
import BrandsTableSection from "./_components/BrandsTableSection";
import BrandsTableSkeleton from "./_components/BrandsTableSkeleton";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminBrandsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = typeof sp.status === "string" ? sp.status : "all";
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const dir = sp.dir === "asc" || sp.dir === "desc" ? sp.dir : undefined;

  return (
    <AdminBrandsShell status={status}>
      <Suspense key={`${page}-${status}-${sort}-${dir}`} fallback={<BrandsTableSkeleton />}>
        <BrandsTableSection page={page} pageSize={PAGE_SIZE} status={status} sort={sort} dir={dir} />
      </Suspense>
    </AdminBrandsShell>
  );
}
