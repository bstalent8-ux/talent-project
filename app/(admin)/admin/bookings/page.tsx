export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminBookingsShell from "./_components/AdminBookingsShell";
import BookingsTableSection from "./_components/BookingsTableSection";
import BookingsTableSkeleton from "./_components/BookingsTableSkeleton";

const PAGE_SIZE_DEFAULT = 10;
const PAGE_SIZE_MAX = 50;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(sp.pageSize) || PAGE_SIZE_DEFAULT));
  const status = typeof sp.status === "string" ? sp.status : "all";

  return (
    <AdminBookingsShell status={status}>
      {/* key forces a fresh Suspense boundary per page/filter combo, so the
          skeleton fallback shows again on every navigation rather than only
          the very first load. */}
      <Suspense key={`${page}-${pageSize}-${status}`} fallback={<BookingsTableSkeleton />}>
        <BookingsTableSection page={page} pageSize={pageSize} status={status} />
      </Suspense>
    </AdminBookingsShell>
  );
}
