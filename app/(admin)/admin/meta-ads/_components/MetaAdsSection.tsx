import { fetchMetaAdsInsights } from "@/features/meta-ads/service";
import type { MetaDatePreset } from "@/features/meta-ads/types";
import MetaAdsView from "./MetaAdsView";

// Async Server Component — the part page.tsx suspends on, mirroring
// UserActivitySection. Server-side fetch to Meta's Graph API on first paint;
// MetaAdsView's own client-side range switch re-fetches through
// /api/admin/meta-ads/insights instead of a full navigation.
export default async function MetaAdsSection({ preset }: { preset: MetaDatePreset }) {
  const result = await fetchMetaAdsInsights(preset);
  return <MetaAdsView result={result} />;
}
