export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminUserActivityShell from "./_components/AdminUserActivityShell";
import UserActivitySection from "./_components/UserActivitySection";
import UserActivitySkeleton from "./_components/UserActivitySkeleton";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUserActivityPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const eventName = typeof sp.event === "string" ? sp.event : undefined;

  return (
    <AdminUserActivityShell from={from} to={to} eventName={eventName}>
      <Suspense key={`${page}-${from}-${to}-${eventName}`} fallback={<UserActivitySkeleton />}>
        <UserActivitySection page={page} pageSize={PAGE_SIZE} from={from} to={to} eventName={eventName} />
      </Suspense>
    </AdminUserActivityShell>
  );
}
