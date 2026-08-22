"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = {
  ar: { image: "الصورة", subject: "العنوان", status: "الحالة", submitted: "تاريخ الإرسال", actions: "الإجراءات" },
  en: { image: "Image", subject: "Title", status: "Status", submitted: "Submitted", actions: "Actions" },
};

export default function BrandMomentsSkeleton() {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <AdminTableSkeleton
      rows={6}
      columns={[
        { label: t.image,     width: 60 },
        { label: t.subject,   width: 150 },
        { label: t.status,    width: 70, pill: true },
        { label: t.submitted, width: 80 },
        { label: t.actions,   width: 60 },
      ]}
    />
  );
}
