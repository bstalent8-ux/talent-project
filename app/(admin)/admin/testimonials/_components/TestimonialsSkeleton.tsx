"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = {
  ar: { author: "الكاتب", quote: "الرأي", status: "الحالة", submitted: "تاريخ الإرسال", actions: "الإجراءات" },
  en: { author: "Author", quote: "Quote", status: "Status", submitted: "Submitted", actions: "Actions" },
};

export default function TestimonialsSkeleton() {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <AdminTableSkeleton
      rows={6}
      columns={[
        { label: t.author,    width: 130 },
        { label: t.quote,     width: 220 },
        { label: t.status,    width: 70, pill: true },
        { label: t.submitted, width: 80 },
        { label: t.actions,   width: 60 },
      ]}
    />
  );
}
