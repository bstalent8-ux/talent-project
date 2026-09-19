export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PendingDataShell from "./_components/PendingDataShell";
import PendingMediaSection from "./_components/PendingMediaSection";
import PendingMediaSkeleton from "./_components/PendingMediaSkeleton";
import { fetchPendingMediaCounts, type PendingMediaStatus, type PendingMediaType } from "@/features/admin/services/pending-media.service";

const PAGE_SIZE = 24;
const STATUSES: PendingMediaStatus[] = ["pending", "rejected", "approved", "all"];
const TYPES: PendingMediaType[] = ["all", "photo", "video"];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// The review queue for portfolio uploads. Every photo/video a talent uploads lands
// here first (portfolio_items.is_approved = false) and only appears on their public
// profile once an admin approves it — even when the profile itself is already approved.
export default async function AdminPendingDataPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = (STATUSES as string[]).includes(String(sp.status)) ? (sp.status as PendingMediaStatus) : "pending";
  const type = (TYPES as string[]).includes(String(sp.type)) ? (sp.type as PendingMediaType) : "all";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";

  const counts = await fetchPendingMediaCounts();

  return (
    <PendingDataShell status={status} type={type} q={q} counts={counts}>
      <Suspense key={`${page}-${status}-${type}-${q}`} fallback={<PendingMediaSkeleton />}>
        <PendingMediaSection page={page} pageSize={PAGE_SIZE} status={status} type={type} q={q} migrated={counts.migrated} />
      </Suspense>
    </PendingDataShell>
  );
}
