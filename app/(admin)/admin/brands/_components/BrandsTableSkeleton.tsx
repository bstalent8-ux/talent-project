"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = {
  ar: { name: "الاسم", username: "اسم المستخدم", city: "المدينة", brandStatus: "حالة الاعتماد", accountStatus: "حالة الحساب", taxDoc: "المستند الضريبي", registered: "التسجيل", actions: "الإجراءات" },
  en: { name: "Name", username: "Username", city: "City", brandStatus: "Approval Status", accountStatus: "Account", taxDoc: "Tax Document", registered: "Registered", actions: "Actions" },
};

export default function BrandsTableSkeleton() {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <AdminTableSkeleton
      columns={[
        { label: t.name,          width: 130 },
        { label: t.username,      width: 90 },
        { label: t.city,          width: 70 },
        { label: t.brandStatus,   width: 80, pill: true },
        { label: t.accountStatus, width: 70, pill: true },
        { label: t.taxDoc,        width: 60 },
        { label: t.registered,    width: 80 },
        { label: t.actions,       width: 90 },
      ]}
    />
  );
}
