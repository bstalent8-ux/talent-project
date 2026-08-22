"use client";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import type { AdminTalentTypeRequest, AdminTalentTypeStats } from "@/features/admin/services/admin.service";

const TX = {
  ar: {
    ugc: "UGC", model: "موديل", other: "أخرى",
    otherBreakdown: "تفاصيل \"أخرى\"",
    noOther: "لا توجد طلبات \"أخرى\" في هذه الفترة",
    recent: "أحدث الطلبات",
    type: "النوع", detail: "التفاصيل", source: "المصدر", campaign: "الحملة", date: "التاريخ", user: "المستخدم",
    noRequests: "لا توجد بيانات في هذه الفترة",
  },
  en: {
    ugc: "UGC", model: "Model", other: "Other",
    otherBreakdown: "\"Other\" breakdown",
    noOther: "No \"Other\" requests in this range",
    recent: "Recent requests",
    type: "Type", detail: "Detail", source: "Source", campaign: "Campaign", date: "Date", user: "User",
    noRequests: "No data in this range",
  },
};

const TYPE_COLOR: Record<string, string> = { ugc: "#00D26A", model: "#F4B740", other: "#8B5CF6" };

interface Props {
  stats:    AdminTalentTypeStats;
  requests: AdminTalentTypeRequest[];
  total:    number;
  page:     number;
  pageSize: number;
  from?:    string;
  to?:      string;
}

function hrefFor(page: number, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return qs ? `/admin/talent-demand?${qs}` : "/admin/talent-demand";
}

export default function TalentDemandView({ stats, requests, total, page, pageSize, from, to }: Props) {
  const { dark, lang } = useSite();
  const t = TX[lang];

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {(["ugc", "model", "other"] as const).map((key) => (
          <div key={key} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{t[key]}</p>
            <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 700, color: TYPE_COLOR[key] }}>{stats[key]}</p>
          </div>
        ))}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: TEXT }}>{t.otherBreakdown}</p>
        {stats.otherBreakdown.length === 0 ? (
          <EmptyState message={t.noOther} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.otherBreakdown.map(({ label, count }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: TEXT }}>
                <span>{label}</span>
                <span style={{ color: MUTED }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
        <p style={{ margin: 0, padding: "14px 16px", fontSize: 14, fontWeight: 600, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
          {t.recent} ({total})
        </p>
        {requests.length === 0 ? (
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
                {requests.map((r) => (
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

      <AdminPagination page={page} totalPages={totalPages} buildHref={(p) => hrefFor(p, from, to)} />
    </>
  );
}
