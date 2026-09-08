"use client";
import { useSite } from "@/contexts/SiteContext";
import { SkeletonBlock, SkeletonStyles } from "@/components/admin/Skeleton";
import AdminStatCardsSkeleton from "@/components/admin/AdminStatCardsSkeleton";

export default function MetaAdsSkeleton() {
  const { dark } = useSite();
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";

  return (
    <>
      <SkeletonStyles />
      <AdminStatCardsSkeleton count={8} withIcon minWidth={160} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 20 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <SkeletonBlock width={120} height={13} style={{ marginBottom: 16 }} />
            <SkeletonBlock width="100%" height={160} radius={10} />
          </div>
        ))}
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
        <SkeletonBlock width={140} height={13} style={{ marginBottom: 16 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} width="100%" height={14} style={{ marginBottom: 12 }} />
        ))}
      </div>
    </>
  );
}
