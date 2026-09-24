"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";

const TX = {
  ar: {
    title: "الإيميلات",
    notConfigured: "خدمة الإيميل مش متوصّلة (RESEND_API_KEY مش موجود) — أي إرسال هيفشل ويتسجل هنا كـ \"فشل\".",
  },
  en: {
    title: "Emails",
    notConfigured: "Email sending isn't connected (RESEND_API_KEY is missing) — any send will fail and log here as \"failed\".",
  },
};

export default function AdminEmailsShell({
  emailConfigured,
  children,
}: {
  emailConfigured: boolean;
  children: React.ReactNode;
}) {
  const { dark, lang } = useSite();
  const t = TX[lang];

  return (
    <AdminShell title={t.title}>
      {!emailConfigured && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 10, fontSize: 12.5,
          backgroundColor: "rgba(231,165,138,0.1)", border: "1px solid rgba(231,165,138,0.3)",
          color: dark ? "#E7A58A" : "#9A4E34",
        }}>
          {t.notConfigured}
        </div>
      )}
      {children}
    </AdminShell>
  );
}
