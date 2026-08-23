"use client";
import { useSite } from "@/contexts/SiteContext";
import { SkeletonStyles } from "@/components/admin/Skeleton";
import AdminStatCardsSkeleton from "@/components/admin/AdminStatCardsSkeleton";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = {
  ar: { recent: "أحدث الأحداث", user: "المستخدم", event: "الحدث", detail: "التفاصيل", date: "التاريخ" },
  en: { recent: "Recent events", user: "User", event: "Event", detail: "Detail", date: "Date" },
};

export default function UserActivitySkeleton() {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <>
      <SkeletonStyles />
      <AdminStatCardsSkeleton count={7} />

      <p style={{ margin: "8px 0 8px", fontSize: 14, fontWeight: 600 }}>{t.recent}</p>
      <AdminTableSkeleton
        showResultsCount={false}
        columns={[
          { label: t.user,   width: 90 },
          { label: t.event,  width: 90 },
          { label: t.detail, width: 160 },
          { label: t.date,   width: 100 },
        ]}
      />
    </>
  );
}
