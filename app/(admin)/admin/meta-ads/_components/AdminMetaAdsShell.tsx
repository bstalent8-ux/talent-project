"use client";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import { META_DATE_PRESETS, type MetaDatePreset } from "@/features/meta-ads/types";

const TX = {
  ar: {
    title: "إعلانات ميتا",
    subtitle: "أرقام الحملات الإعلانية من فيسبوك/انستجرام — صرف، نتايج، محادثات — للحساب الإعلاني المربوط.",
    range: "الفترة",
    today: "اليوم", yesterday: "أمس", last_7d: "آخر 7 أيام", last_14d: "آخر 14 يوم",
    last_30d: "آخر 30 يوم", last_90d: "آخر 90 يوم", this_month: "الشهر الحالي", last_month: "الشهر الماضي",
  },
  en: {
    title: "Meta Ads",
    subtitle: "Facebook/Instagram campaign numbers — spend, results, conversations — for the connected ad account.",
    range: "Range",
    today: "Today", yesterday: "Yesterday", last_7d: "Last 7 days", last_14d: "Last 14 days",
    last_30d: "Last 30 days", last_90d: "Last 90 days", this_month: "This month", last_month: "Last month",
  },
};

export default function AdminMetaAdsShell({
  preset,
  children,
}: {
  preset: MetaDatePreset;
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

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: MUTED }}>
          {t.range}
          <select
            defaultValue={preset}
            onChange={(e) => router.push(`/admin/meta-ads?preset=${e.target.value}`)}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT, fontSize: 13 }}
          >
            {META_DATE_PRESETS.map((p) => (
              <option key={p} value={p}>{t[p]}</option>
            ))}
          </select>
        </label>
      </div>

      {children}
    </AdminShell>
  );
}
