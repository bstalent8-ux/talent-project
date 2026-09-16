export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminTalentsShell from "./_components/AdminTalentsShell";
import TalentsTableSection from "./_components/TalentsTableSection";
import TalentsTableSkeleton from "./_components/TalentsTableSkeleton";
import { fetchAdminTalentFilterOptions } from "@/features/admin/services/admin.service";

const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_PAGE_SIZES = [10, 25, 100];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminTalentsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = typeof sp.status === "string" ? sp.status : "all";
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const dir = sp.dir === "asc" || sp.dir === "desc" ? sp.dir : undefined;
  const duplicate = sp.duplicate === "with" || sp.duplicate === "without" ? sp.duplicate : "all";
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const requestedPageSize = Number(sp.pageSize);
  const pageSize = ALLOWED_PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : DEFAULT_PAGE_SIZE;

  const filterOptions = await fetchAdminTalentFilterOptions();

  return (
    <AdminTalentsShell status={status} category={category} city={city} duplicate={duplicate} q={q} filterOptions={filterOptions}>
      <Suspense key={`${page}-${status}-${pageSize}-${category}-${city}-${sort}-${dir}-${duplicate}-${q}`} fallback={<TalentsTableSkeleton />}>
        <TalentsTableSection page={page} pageSize={pageSize} status={status} category={category} city={city} sort={sort} dir={dir} duplicate={duplicate} q={q} />
      </Suspense>
    </AdminTalentsShell>
  );
}
