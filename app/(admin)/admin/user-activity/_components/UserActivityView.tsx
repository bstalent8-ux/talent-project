"use client";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import { USER_EVENT_NAMES, type UserEventName, type AdminUserEvent, type AdminUserActivityStats } from "@/features/admin/services/admin.service";

const TX = {
  ar: {
    page_view: "زيارة صفحة", talent_profile_view: "زيارة بروفايل", search: "بحث",
    booking_brief_sent: "طلب حجز", job_application: "تقديم وظيفة", signup: "تسجيل", login: "دخول",
    recent: "أحدث الأحداث",
    user: "المستخدم", event: "الحدث", target: "الهدف", detail: "التفاصيل", date: "التاريخ",
    guest: "زائر",
    noEvents: "لا توجد بيانات في هذه الفترة",
  },
  en: {
    page_view: "Page view", talent_profile_view: "Profile view", search: "Search",
    booking_brief_sent: "Booking brief", job_application: "Job application", signup: "Signup", login: "Login",
    recent: "Recent events",
    user: "User", event: "Event", target: "Target", detail: "Detail", date: "Date",
    guest: "Guest",
    noEvents: "No data in this range",
  },
};

const EVENT_COLOR: Record<UserEventName, string> = {
  page_view:           "#64748b",
  talent_profile_view: "#00D26A",
  search:              "#0EA5E9",
  booking_brief_sent:  "#F4B740",
  job_application:     "#8B5CF6",
  signup:              "#EC4899",
  login:               "#14B8A6",
};

function detailFor(e: AdminUserEvent): string {
  const m = e.metadata as Record<string, unknown>;
  if (e.eventName === "page_view" && typeof m.path === "string") return m.path;
  if (e.eventName === "search" && typeof m.query === "string") return `"${m.query}"`;
  if (e.eventName === "signup" && typeof m.role === "string") return m.role;
  if (e.eventName === "login" && typeof m.role === "string") return m.role;
  return e.targetType ? `${e.targetType}${e.targetId ? ` · ${e.targetId.slice(0, 8)}` : ""}` : "—";
}

interface Props {
  stats:      AdminUserActivityStats;
  events:     AdminUserEvent[];
  total:      number;
  page:       number;
  pageSize:   number;
  from?:      string;
  to?:        string;
  eventName?: string;
}

function hrefFor(page: number, from?: string, to?: string, eventName?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (eventName) params.set("event", eventName);
  const qs = params.toString();
  return qs ? `/admin/user-activity?${qs}` : "/admin/user-activity";
}

export default function UserActivityView({ stats, events, total, page, pageSize, from, to, eventName }: Props) {
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
        {(USER_EVENT_NAMES as readonly UserEventName[]).map((key) => (
          <div key={key} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{t[key]}</p>
            <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 700, color: EVENT_COLOR[key] }}>{stats[key]}</p>
          </div>
        ))}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
        <p style={{ margin: 0, padding: "14px 16px", fontSize: 14, fontWeight: 600, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
          {t.recent} ({total})
        </p>
        {events.length === 0 ? (
          <EmptyState message={t.noEvents} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: TH }}>
                  {[t.user, t.event, t.detail, t.date].map((h) => (
                    <th key={h} style={{ textAlign: "start", padding: "10px 16px", color: MUTED, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "10px 16px", color: TEXT }}>{e.handle ?? e.fullName ?? (e.userId ? e.userId.slice(0, 8) : t.guest)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ color: EVENT_COLOR[e.eventName], fontWeight: 600 }}>{t[e.eventName]}</span>
                    </td>
                    <td style={{ padding: "10px 16px", color: TEXT, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detailFor(e)}</td>
                    <td style={{ padding: "10px 16px", color: MUTED }}>{new Date(e.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={page} totalPages={totalPages} buildHref={(p) => hrefFor(p, from, to, eventName)} />
    </>
  );
}
