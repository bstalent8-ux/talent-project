export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminReviewsShell from "./_components/AdminReviewsShell";
import ReviewsTableSection from "./_components/ReviewsTableSection";
import ReviewsTableSkeleton from "./_components/ReviewsTableSkeleton";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminReviewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = typeof sp.status === "string" ? sp.status : "all";
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const dir = sp.dir === "asc" || sp.dir === "desc" ? sp.dir : undefined;

  return (
    <AdminReviewsShell status={status}>
      <Suspense key={`${page}-${status}-${sort}-${dir}`} fallback={<ReviewsTableSkeleton />}>
        <ReviewsTableSection page={page} pageSize={PAGE_SIZE} status={status} sort={sort} dir={dir} />
      </Suspense>
    </AdminReviewsShell>
  );
}
