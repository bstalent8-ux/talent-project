"use client";
import { useSite } from "@/contexts/SiteContext";
import { SkeletonBlock, SkeletonStyles } from "@/components/admin/Skeleton";
import AdminStatCardsSkeleton from "@/components/admin/AdminStatCardsSkeleton";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = {
  ar: { otherBreakdown: "تفاصيل \"أخرى\"", recent: "أحدث الطلبات", type: "النوع", detail: "التفاصيل", source: "المصدر", campaign: "الحملة", date: "التاريخ", user: "المستخدم" },
  en: { otherBreakdown: "\"Other\" breakdown", recent: "Recent requests", type: "Type", detail: "Detail", source: "Source", campaign: "Campaign", date: "Date", user: "User" },
};

export default function TalentDemandSkeleton() {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";

  return (
    <>
      <SkeletonStyles />
      <AdminStatCardsSkeleton count={3} />

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: TEXT }}>{t.otherBreakdown}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
              <SkeletonBlock width={120} />
              <SkeletonBlock width={24} />
            </div>
          ))}
        </div>
      </div>

      <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: TEXT }}>{t.recent}</p>
      <AdminTableSkeleton
        showResultsCount={false}
        columns={[
          { label: t.user,     width: 90 },
          { label: t.type,     width: 60 },
          { label: t.detail,   width: 110 },
          { label: t.source,   width: 70 },
          { label: t.campaign, width: 90 },
          { label: t.date,     width: 80 },
        ]}
      />
    </>
  );
}
