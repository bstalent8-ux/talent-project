"use client";
import { useMemo, useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import EmptyState from "@/components/admin/EmptyState";
import type { AdminTalentTypeRequest } from "@/features/admin/services/admin.service";

const TX = {
  ar: {
    title: "طلب أنواع المواهب",
    subtitle: "أنواع الموهبة اللي المسجلين الجدد بيختاروها — لتقرير أي نوع نبنيه بعد كده.",
    ugc: "UGC", model: "موديل", other: "أخرى",
    from: "من", to: "إلى",
    otherBreakdown: "تفاصيل \"أخرى\"",
    noOther: "لا توجد طلبات \"أخرى\" في هذه الفترة",
    recent: "أحدث الطلبات",
    type: "النوع", detail: "التفاصيل", source: "المصدر", campaign: "الحملة", date: "التاريخ", user: "المستخدم",
    noRequests: "لا توجد بيانات في هذه الفترة",
    total: "الإجمالي",
  },
  en: {
    title: "Talent Type Demand",
    subtitle: "What talent type new signups are picking — for deciding which type to build next.",
    ugc: "UGC", model: "Model", other: "Other",
    from: "From", to: "To",
    otherBreakdown: "\"Other\" breakdown",
    noOther: "No \"Other\" requests in this range",
    recent: "Recent requests",
    type: "Type", detail: "Detail", source: "Source", campaign: "Campaign", date: "Date", user: "User",
    noRequests: "No data in this range",
    total: "Total",
  },
};

const TYPE_COLOR: Record<string, string> = { ugc: "#00D26A", model: "#F4B740", other: "#8B5CF6" };

export default function AdminTalentDemandClient({ requests }: { requests: AdminTalentTypeRequest[] }) {
  const { dark, lang } = useSite();
  const t = TX[lang];

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";

  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const day = r.createdAt.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [requests, from, to]);

  const counts = useMemo(() => {
    const c = { ugc: 0, model: 0, other: 0 };
    for (const r of filtered) c[r.selectedType]++;
    return c;
  }, [filtered]);

  const otherBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      if (r.selectedType !== "other") continue;
      const key = (r.otherTypeText ?? "—").trim();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  return (
    <AdminShell title={t.title}>
      <p style={{ color: MUTED, fontSize: 14, marginTop: -8, marginBottom: 20 }}>{t.subtitle}</p>

      {/* Date range filter */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: MUTED }}>
          {t.from}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT, fontSize: 13 }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: MUTED }}>
          {t.to}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT, fontSize: 13 }} />
        </label>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {(["ugc", "model", "other"] as const).map((key) => (
          <div key={key} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{t[key]}</p>
            <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 700, color: TYPE_COLOR[key] }}>{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Other breakdown */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: TEXT }}>{t.otherBreakdown}</p>
        {otherBreakdown.length === 0 ? (
          <EmptyState message={t.noOther} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {otherBreakdown.map(([label, count]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: TEXT }}>
                <span>{label}</span>
                <span style={{ color: MUTED }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent requests table */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
        <p style={{ margin: 0, padding: "14px 16px", fontSize: 14, fontWeight: 600, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
          {t.recent} ({filtered.length})
        </p>
        {filtered.length === 0 ? (
          <EmptyState message={t.noRequests} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: TH }}>
                  {[t.user, t.type, t.detail, t.source, t.campaign, t.date].map((h) => (
                    <th key={h} style={{ textAlign: "start", padding: "10px 16px", color: MUTED, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "10px 16px", color: TEXT }}>{r.handle ?? r.fullName ?? r.userId.slice(0, 8)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ color: TYPE_COLOR[r.selectedType], fontWeight: 600 }}>{t[r.selectedType]}</span>
                    </td>
                    <td style={{ padding: "10px 16px", color: TEXT }}>{r.otherTypeText ?? "—"}</td>
                    <td style={{ padding: "10px 16px", color: MUTED }}>{r.utmSource ?? "—"}</td>
                    <td style={{ padding: "10px 16px", color: MUTED }}>{r.utmCampaign ?? "—"}</td>
                    <td style={{ padding: "10px 16px", color: MUTED }}>{new Date(r.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
