export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminMetaAdsShell from "./_components/AdminMetaAdsShell";
import MetaAdsSection from "./_components/MetaAdsSection";
import MetaAdsSkeleton from "./_components/MetaAdsSkeleton";
import { META_DATE_PRESETS, type MetaDatePreset } from "@/features/meta-ads/types";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function isDatePreset(v: unknown): v is MetaDatePreset {
  return typeof v === "string" && (META_DATE_PRESETS as readonly string[]).includes(v);
}

export default async function AdminMetaAdsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const preset: MetaDatePreset = isDatePreset(sp.preset) ? sp.preset : "last_30d";

  return (
    <AdminMetaAdsShell preset={preset}>
      <Suspense key={preset} fallback={<MetaAdsSkeleton />}>
        <MetaAdsSection preset={preset} />
      </Suspense>
    </AdminMetaAdsShell>
  );
}
