"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = { ar: { brand: "الشركة", talent: "الموهبة", status: "الحالة", date: "التاريخ", amount: "المبلغ", actions: "الإجراءات" },
             en: { brand: "Brand",  talent: "Talent",  status: "Status", date: "Date",    amount: "Amount", actions: "Actions" } };

export default function BookingsTableSkeleton() {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <AdminTableSkeleton
      columns={[
        { label: t.brand,   width: 110 },
        { label: t.talent,  width: 110 },
        { label: t.amount,  width: 60 },
        { label: t.status,  width: 80, pill: true },
        { label: t.date,    width: 80 },
        { label: t.actions, width: 70 },
      ]}
    />
  );
}
