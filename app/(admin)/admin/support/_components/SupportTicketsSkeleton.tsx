"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = {
  ar: { from: "من", subject: "الموضوع", status: "الحالة", submitted: "التاريخ" },
  en: { from: "From", subject: "Subject", status: "Status", submitted: "Date" },
};

export default function SupportTicketsSkeleton() {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <AdminTableSkeleton
      columns={[
        { label: t.from,      width: 130 },
        { label: t.subject,   width: 150 },
        { label: t.status,    width: 80, pill: true },
        { label: t.submitted, width: 80 },
      ]}
    />
  );
}
