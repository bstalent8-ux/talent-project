"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = {
  ar: { name: "الاسم", username: "اسم المستخدم", category: "التصنيف", city: "المدينة", registered: "تاريخ التسجيل", status: "الحالة", actions: "الإجراءات" },
  en: { name: "Name", username: "Username", category: "Category", city: "City", registered: "Registered", status: "Status", actions: "Actions" },
};

export default function TalentsTableSkeleton() {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <AdminTableSkeleton
      columns={[
        { label: t.name,       width: 130 },
        { label: t.username,   width: 90 },
        { label: t.category,   width: 80 },
        { label: t.city,       width: 70 },
        { label: t.registered, width: 80 },
        { label: t.status,     width: 80, pill: true },
        { label: t.actions,    width: 90 },
      ]}
    />
  );
}
