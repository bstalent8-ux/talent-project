"use client";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";

const TX = {
  ar: { title: "طلب أنواع المواهب", subtitle: "أنواع الموهبة اللي المسجلين الجدد بيختاروها — لتقرير أي نوع نبنيه بعد كده.", from: "من", to: "إلى" },
  en: { title: "Talent Type Demand", subtitle: "What talent type new signups are picking — for deciding which type to build next.", from: "From", to: "To" },
};

function buildHref(from: string, to: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return qs ? `/admin/talent-demand?${qs}` : "/admin/talent-demand";
}

// Sidebar + topbar + date-range filter — rendered immediately, never
// suspended. Changing a date navigates (resets page to 1 implicitly, since
// the href never carries a `page` param) while only the stats/table area
// (children, wrapped in <Suspense> by page.tsx) shows a skeleton.
export default function AdminTalentDemandShell({
  from = "",
  to = "",
  children,
}: {
  from?: string;
  to?: string;
  children: React.ReactNode;
}) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";

  return (
    <AdminShell title={t.title}>
      <p style={{ color: MUTED, fontSize: 14, marginTop: -8, marginBottom: 20 }}>{t.subtitle}</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: MUTED }}>
          {t.from}
          <input
            type="date"
            defaultValue={from}
            onChange={(e) => router.push(buildHref(e.target.value, to))}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT, fontSize: 13 }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: MUTED }}>
          {t.to}
          <input
            type="date"
            defaultValue={to}
            onChange={(e) => router.push(buildHref(from, e.target.value))}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT, fontSize: 13 }}
          />
        </label>
      </div>

      {children}
    </AdminShell>
  );
}
