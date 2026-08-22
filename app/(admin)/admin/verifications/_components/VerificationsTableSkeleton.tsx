"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";

const TX = {
  ar: { name: "الاسم", username: "اسم المستخدم", status: "الحالة", idDoc: "وثيقة الهوية", selfie: "صورة شخصية", socialProof: "إثبات السوشيال", submitted: "تاريخ الطلب", actions: "الإجراءات" },
  en: { name: "Name", username: "Username", status: "Status", idDoc: "ID Document", selfie: "Selfie", socialProof: "Social Proof", submitted: "Submitted", actions: "Actions" },
};

export default function VerificationsTableSkeleton() {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <AdminTableSkeleton
      columns={[
        { label: t.name,        width: 120 },
        { label: t.username,    width: 90 },
        { label: t.status,      width: 70, pill: true },
        { label: t.idDoc,       width: 50 },
        { label: t.selfie,      width: 50 },
        { label: t.socialProof, width: 50 },
        { label: t.submitted,   width: 80 },
        { label: t.actions,     width: 60 },
      ]}
    />
  );
}
