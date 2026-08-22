"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = {
  ar: { brand: "الشركة", talent: "الموهبة", rating: "التقييم", type: "النوع", status: "الحالة", proof: "إثبات", comment: "التعليق", date: "التاريخ", actions: "الإجراءات" },
  en: { brand: "Brand", talent: "Talent", rating: "Rating", type: "Type", status: "Status", proof: "Proof", comment: "Comment", date: "Date", actions: "Actions" },
};

export default function ReviewsTableSkeleton() {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <AdminTableSkeleton
      columns={[
        { label: t.brand,   width: 100 },
        { label: t.talent,  width: 100 },
        { label: t.rating,  width: 70 },
        { label: t.type,    width: 60, pill: true },
        { label: t.status,  width: 70, pill: true },
        { label: t.proof,   width: 30 },
        { label: t.comment, width: 140 },
        { label: t.date,    width: 70 },
        { label: t.actions, width: 60 },
      ]}
    />
  );
}
