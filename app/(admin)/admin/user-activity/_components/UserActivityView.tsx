"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  USER_EVENT_NAMES, summarizeTrafficSources,
  type UserEventName, type AdminUserEvent, type AdminUserActivityStats, type AdminVisitor, type AdminTrafficSource,
  type AdminDailyTrafficPoint, type AdminTopPage, type AdminSignupBreakdown,
} from "@/features/admin/services/admin.service";
import { formatTalentTag } from "@/lib/talent-tags";
import { EVENT_LABEL, EVENT_COLOR, detailFor } from "../_lib/eventFormat";
import { MultiLineTrendChart, ChartLegend, RankedBarList } from "./charts";

// How often the client re-polls /api/admin/user-activity for fresh data —
// see the effect below. Short enough to feel live, long enough that eight
// count-only queries (fetchAdminUserActivityStats) plus one paginated
// select don't run needlessly often for a page nobody is currently reading.
const POLL_MS = 8_000;

const TX = {
  ar: {
    recent: "أحدث الأحداث",
    user: "المستخدم", event: "الحدث", target: "الهدف", detail: "التفاصيل", date: "التاريخ",
    guest: "زائر",
    noEvents: "لا توجد بيانات في هذه الفترة",
    visitors: "الزوار", firstSeen: "أول ظهور", lastSeen: "آخر نشاط", eventCount: "عدد الأحداث",
    registered: "سجل؟", registeredYes: "سجل", registeredNo: "لم يسجل",
    noVisitors: "لا يوجد زوار في هذه الفترة",
    trafficSources: "مصادر التسجيل", source: "المصدر", campaign: "الحملة", signups: "عدد التسجيلات",
    noTrafficSources: "لا توجد تسجيلات في هذه الفترة", organic: "عضوي (بدون رابط معلَّم)",
    registerTotal: "إجمالي التسجيلات", fromCampaigns: "من حملات إعلانية", fromOrganic: "عضوي (جروبات فيسبوك)",
    trafficTrend: "الزيارات والتسجيلات عبر الوقت", noTrend: "لا توجد بيانات كافية لعرض جراف",
    pageViewsLegend: "زيارات صفحات", signupsLegend: "تسجيلات", clicksLegend: "دوسات", profileViewsLegend: "زيارات بروفايل",
    conversionRate: "نسبة التحويل لتسجيل", visitedNotRegistered: "دخلوا ومسجلوش",
    topPages: "أكتر الصفحات نشاطاً", page: "الصفحة", views: "زيارات", clicks: "دوسات", avgTime: "متوسط الوقت",
    noTopPages: "لا توجد بيانات كافية عن الصفحات",
    signupsByRole: "التسجيلات حسب النوع", signupsByCategory: "تسجيلات المواهب حسب الفئة",
    noBreakdown: "لا توجد بيانات",
    talent: "موهبة", brand: "شركة", unknown: "غير محدد",
  },
  en: {
    recent: "Recent events",
    user: "User", event: "Event", target: "Target", detail: "Detail", date: "Date",
    guest: "Guest",
    noEvents: "No data in this range",
    visitors: "Visitors", firstSeen: "First seen", lastSeen: "Last active", eventCount: "Events",
    registered: "Registered?", registeredYes: "Registered", registeredNo: "Not registered",
    noVisitors: "No visitors in this range",
    trafficSources: "Signup sources", source: "Source", campaign: "Campaign", signups: "Signups",
    noTrafficSources: "No signups in this range", organic: "Organic (untagged link)",
    registerTotal: "Total registered", fromCampaigns: "From ad campaigns", fromOrganic: "Organic (Facebook Groups)",
    trafficTrend: "Traffic & signups over time", noTrend: "Not enough data to chart yet",
    pageViewsLegend: "Page views", signupsLegend: "Signups", clicksLegend: "Clicks", profileViewsLegend: "Profile views",
    conversionRate: "Visitor-to-signup rate", visitedNotRegistered: "Visited, didn't register",
    topPages: "Top pages by activity", page: "Page", views: "Views", clicks: "Clicks", avgTime: "Avg. time",
    noTopPages: "Not enough page data yet",
    signupsByRole: "Signups by type", signupsByCategory: "Talent signups by category",
    noBreakdown: "No data",
    talent: "Talent", brand: "Brand", unknown: "Unknown",
  },
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  stats:           AdminUserActivityStats;
  events:          AdminUserEvent[];
  total:           number;
  visitors:        AdminVisitor[];
  trafficSources:  AdminTrafficSource[];
  dailyTraffic:    AdminDailyTrafficPoint[];
  topPages:        AdminTopPage[];
  signupBreakdown: AdminSignupBreakdown;
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

export default function UserActivityView({
  stats: initialStats, events: initialEvents, total: initialTotal, visitors: initialVisitors,
  trafficSources: initialTrafficSources, dailyTraffic: initialDailyTraffic,
  topPages: initialTopPages, signupBreakdown: initialSignupBreakdown,
  page, pageSize, from, to, eventName,
}: Props) {
  const { dark, lang } = useSite();
  const t = TX[lang];

  const [stats,           setStats]           = useState(initialStats);
  const [events,          setEvents]          = useState(initialEvents);
  const [total,           setTotal]           = useState(initialTotal);
  const [visitors,        setVisitors]        = useState(initialVisitors);
  const [trafficSources,  setTrafficSources]  = useState(initialTrafficSources);
  const [dailyTraffic,    setDailyTraffic]    = useState(initialDailyTraffic);
  const [topPages,        setTopPages]        = useState(initialTopPages);
  const [signupBreakdown, setSignupBreakdown] = useState(initialSignupBreakdown);

  // A real navigation (filter pill, pagination link) re-renders this
  // component with fresh server props — resync local state to that instead
  // of letting a stale poll result win the race.
  useEffect(() => {
    setStats(initialStats);
    setEvents(initialEvents);
    setTotal(initialTotal);
    setVisitors(initialVisitors);
    setTrafficSources(initialTrafficSources);
    setDailyTraffic(initialDailyTraffic);
    setTopPages(initialTopPages);
    setSignupBreakdown(initialSignupBreakdown);
  }, [initialStats, initialEvents, initialTotal, initialVisitors, initialTrafficSources, initialDailyTraffic, initialTopPages, initialSignupBreakdown]);

  // Polls the same data this page was server-rendered with, on a timer, so
  // new events (page views, clicks, engagement heartbeats) show up without
  // the admin having to refresh. Skips a tick while the tab isn't visible —
  // no point re-querying for a page nobody is looking at.
  const paramsKey = `${page}|${pageSize}|${from ?? ""}|${to ?? ""}|${eventName ?? ""}`;
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (eventName) params.set("event", eventName);

      try {
        const res = await fetch(`/api/admin/user-activity?${params.toString()}`, { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setStats(data.stats);
        setEvents(data.events);
        setTotal(data.total);
        setVisitors(data.visitors);
        setTrafficSources(data.trafficSources);
        setDailyTraffic(data.dailyTraffic);
        setTopPages(data.topPages);
        setSignupBreakdown(data.signupBreakdown);
      } catch {
        // Fire-and-forget — the next tick just tries again.
      }
    }

    const id = setInterval(poll, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const TH     = dark ? "#0a121c" : "#f8fafc";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const trafficSummary = summarizeTrafficSources(trafficSources);
  const SUMMARY_CARD_COLOR = { total: TEXT, campaign: "#00D26A", organic: MUTED } as const;

  // "Visited but didn't register" — every visitor in this range's rollup
  // already carries a `registered` flag (see fetchAdminUserActivityVisitors),
  // so this reads straight off that instead of a separate query.
  const registeredCount = visitors.filter((v) => v.registered).length;
  const guestCount = visitors.length - registeredCount;
  const conversionPct = visitors.length > 0 ? (registeredCount / visitors.length) * 100 : 0;

  const TREND_SERIES = [
    { key: "pageViews",          label: t.pageViewsLegend,     color: "#60A5FA", data: dailyTraffic.map((d) => ({ date: d.date, value: d.pageViews })) },
    { key: "signups",            label: t.signupsLegend,       color: "#00D26A", data: dailyTraffic.map((d) => ({ date: d.date, value: d.signups })) },
    { key: "clicks",             label: t.clicksLegend,        color: "#F472B6", data: dailyTraffic.map((d) => ({ date: d.date, value: d.clicks })) },
    { key: "talentProfileViews", label: t.profileViewsLegend,  color: "#F4B740", data: dailyTraffic.map((d) => ({ date: d.date, value: d.talentProfileViews })) },
  ];

  const roleLabel = (role: string) => (role === "talent" ? t.talent : role === "brand" ? t.brand : t.unknown);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
        {(USER_EVENT_NAMES as readonly UserEventName[]).map((key) => (
          <div key={key} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{EVENT_LABEL[lang][key]}</p>
            <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 700, color: EVENT_COLOR[key] }}>{stats[key]}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {([
          ["total",    t.registerTotal,  trafficSummary.total],
          ["campaign", t.fromCampaigns,  trafficSummary.campaign],
          ["organic",  t.fromOrganic,    trafficSummary.organic],
        ] as const).map(([key, label, value]) => (
          <div key={key} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 700, color: SUMMARY_CARD_COLOR[key] }}>{value}</p>
          </div>
        ))}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{t.conversionRate}</p>
          <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 700, color: "#00D26A" }}>{conversionPct.toFixed(1)}%</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: MUTED }}>{guestCount} {t.visitedNotRegistered}</p>
        </div>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: TEXT }}>{t.trafficTrend}</p>
        {dailyTraffic.length < 2 ? (
          <EmptyState message={t.noTrend} />
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <ChartLegend series={TREND_SERIES} textColor={MUTED} />
            </div>
            <MultiLineTrendChart series={TREND_SERIES} />
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: TEXT }}>{t.signupsByRole}</p>
          {signupBreakdown.byRole.length === 0 ? (
            <EmptyState message={t.noBreakdown} />
          ) : (
            <RankedBarList
              data={signupBreakdown.byRole.map((r) => ({ label: roleLabel(r.role), value: r.count }))}
              color="#60A5FA"
              mutedColor={dark ? "#1e293b" : "#E2E8F0"}
              textColor={TEXT}
              formatValue={(v) => String(v)}
            />
          )}
        </div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: TEXT }}>{t.signupsByCategory}</p>
          {signupBreakdown.byCategory.length === 0 ? (
            <EmptyState message={t.noBreakdown} />
          ) : (
            <RankedBarList
              data={signupBreakdown.byCategory.map((c) => ({ label: c.category === "unknown" ? t.unknown : formatTalentTag(c.category, lang), value: c.count }))}
              color="#F97316"
              mutedColor={dark ? "#1e293b" : "#E2E8F0"}
              textColor={TEXT}
              formatValue={(v) => String(v)}
            />
          )}
        </div>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
        <p style={{ margin: 0, padding: "14px 16px", fontSize: 14, fontWeight: 600, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
          {t.topPages} ({topPages.length})
        </p>
        {topPages.length === 0 ? (
          <EmptyState message={t.noTopPages} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: TH }}>
                  {[t.page, t.views, t.clicks, t.avgTime].map((h) => (
                    <th key={h} style={{ textAlign: "start", padding: "10px 16px", color: MUTED, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topPages.slice(0, 20).map((p) => (
                  <tr key={p.path} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "10px 16px", color: TEXT, direction: "ltr", textAlign: lang === "ar" ? "right" : "left", fontFamily: "monospace", fontSize: 12.5 }}>{p.path}</td>
                    <td style={{ padding: "10px 16px", color: TEXT, fontVariantNumeric: "tabular-nums" }}>{p.views}</td>
                    <td style={{ padding: "10px 16px", color: TEXT, fontVariantNumeric: "tabular-nums" }}>{p.clicks}</td>
                    <td style={{ padding: "10px 16px", color: MUTED, fontVariantNumeric: "tabular-nums" }}>{p.totalTimeMs > 0 ? formatDuration(p.avgTimeMs) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
        <p style={{ margin: 0, padding: "14px 16px", fontSize: 14, fontWeight: 600, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
          {t.visitors} ({visitors.length})
        </p>
        {visitors.length === 0 ? (
          <EmptyState message={t.noVisitors} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: TH }}>
                  {[t.user, t.registered, t.firstSeen, t.lastSeen, t.eventCount].map((h) => (
                    <th key={h} style={{ textAlign: "start", padding: "10px 16px", color: MUTED, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.key} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: 0 }}>
                      <Link
                        href={`/admin/user-activity/${encodeURIComponent(v.key)}`}
                        style={{ display: "block", padding: "10px 16px", color: TEXT, textDecoration: "none" }}
                      >
                        {v.handle ?? v.fullName ?? (v.userId ? v.userId.slice(0, 8) : `${t.guest} · ${v.sessionId.slice(0, 8)}`)}
                      </Link>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        backgroundColor: v.registered ? "rgba(0,210,106,0.15)" : "rgba(148,163,184,0.15)",
                        color: v.registered ? "#00D26A" : MUTED,
                      }}>
                        {v.registered ? (v.role ? `${t.registeredYes} · ${v.role}` : t.registeredYes) : t.registeredNo}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: MUTED }}>{new Date(v.firstSeen).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}</td>
                    <td style={{ padding: "10px 16px", color: MUTED }}>{new Date(v.lastSeen).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}</td>
                    <td style={{ padding: "10px 16px", color: TEXT }}>{v.eventCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                      <span style={{ color: EVENT_COLOR[e.eventName], fontWeight: 600 }}>{EVENT_LABEL[lang][e.eventName]}</span>
                    </td>
                    <td style={{ padding: "10px 16px", color: TEXT, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detailFor(e, lang)}</td>
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
