"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = {
  ar: { name: "الاسم", contact: "بيانات التواصل", status: "الحالة", assigned: "المسؤول", created: "تاريخ الإضافة", actions: "" },
  en: { name: "Name", contact: "Contact", status: "Status", assigned: "Assigned to", created: "Added", actions: "" },
};

export default function LeadsTableSkeleton() {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <AdminTableSkeleton
      columns={[
        { label: t.name, width: 120 },
        { label: t.contact, width: 140 },
        { label: t.status, width: 80, pill: true },
        { label: t.assigned, width: 90 },
        { label: t.created, width: 80 },
        { label: t.actions, width: 30 },
      ]}
    />
  );
}
