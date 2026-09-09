"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

export default function BlogSkeleton() {
  const { lang } = useSite();
  const ar = lang === "ar";

  return (
    <AdminTableSkeleton
      columns={[
        { label: ar ? "الصورة" : "Cover", width: 48 },
        { label: ar ? "العنوان" : "Title", width: 160 },
        { label: ar ? "التصنيف" : "Category", width: 70 },
        { label: ar ? "اللغة" : "Lang", width: 40 },
        { label: ar ? "الحالة" : "Status", width: 70, pill: true },
        { label: ar ? "المشاهدات" : "Views", width: 50 },
        { label: ar ? "تاريخ النشر" : "Published", width: 90 },
        { label: ar ? "الإجراءات" : "Actions", width: 90 },
      ]}
    />
  );
}
