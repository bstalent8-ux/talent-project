"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";

const TX = {
  ar: {
    title: "الفحص الصحي",
    subtitle: "فحص سريع لحالة المنصة: ميديا Cloudinary، إعدادات الأمان، زمن الاستجابة، والزيارات — بضغطة زرار.",
  },
  en: {
    title: "Health Check",
    subtitle: "A quick platform checkup: Cloudinary media, security config, response time, and traffic — one click.",
  },
};

export default function AdminHealthCheckShell({ children }: { children: React.ReactNode }) {
  const { lang } = useSite();
  const t = TX[lang];
  const MUTED = "var(--text-muted)";

  return (
    <AdminShell title={t.title}>
      <p style={{ color: MUTED, fontSize: 14, marginTop: -8, marginBottom: 20 }}>{t.subtitle}</p>
      {children}
    </AdminShell>
  );
}
