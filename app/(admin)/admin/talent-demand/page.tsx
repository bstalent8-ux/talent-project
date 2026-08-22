export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminTalentDemandShell from "./_components/AdminTalentDemandShell";
import TalentDemandSection from "./_components/TalentDemandSection";
import TalentDemandSkeleton from "./_components/TalentDemandSkeleton";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminTalentDemandPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;

  return (
    <AdminTalentDemandShell from={from} to={to}>
      <Suspense key={`${page}-${from}-${to}`} fallback={<TalentDemandSkeleton />}>
        <TalentDemandSection page={page} pageSize={PAGE_SIZE} from={from} to={to} />
      </Suspense>
    </AdminTalentDemandShell>
  );
}
