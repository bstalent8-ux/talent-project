export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import NotificationLogShell from "./_components/NotificationLogShell";
import NotificationLogSection from "./_components/NotificationLogSection";
import NotificationLogSkeleton from "./_components/NotificationLogSkeleton";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminNotificationsLogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const type = typeof sp.type === "string" && sp.type ? sp.type : undefined;

  return (
    <NotificationLogShell>
      <Suspense key={`${page}-${type ?? ""}`} fallback={<NotificationLogSkeleton />}>
        <NotificationLogSection page={page} pageSize={PAGE_SIZE} type={type} />
      </Suspense>
    </NotificationLogShell>
  );
}
