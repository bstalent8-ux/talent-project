"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import EmptyState from "@/components/admin/EmptyState";
import type { AdminVisitorDetail } from "@/features/admin/services/admin.service";
import { EVENT_LABEL, EVENT_COLOR, detailFor } from "../../_lib/eventFormat";

const TX = {
  ar: {
    back: "رجوع لكل الزوار",
    guest: "زائر",
    firstSeen: "أول ظهور", lastSeen: "آخر نشاط", totalEvents: "إجمالي الأحداث",
    registeredYes: "سجل", registeredNo: "لم يسجل بعد",
    profileData: "البيانات اللي ملاها",
    role: "الحساب", phone: "التليفون", city: "المدينة", bio: "نبذة",
    category: "التخصص", specialties: "المجالات", availability: "الحالة",
    notFilled: "لسه ملهاش",
    timePerPage: "الوقت في كل صفحة",
    page: "الصفحة", totalTime: "إجمالي الوقت", visits: "زيارات",
    noPageTime: "لا توجد بيانات وقت بعد",
    allActivity: "كل النشاط",
    event: "الحدث", detail: "التفاصيل", date: "التاريخ",
    limitNote: (n: number) => `آخر ${n} حدث`,
  },
  en: {
    back: "Back to all visitors",
    guest: "Guest",
    firstSeen: "First seen", lastSeen: "Last active", totalEvents: "Total events",
    registeredYes: "Registered", registeredNo: "Not registered yet",
    profileData: "Data filled in",
    role: "Account", phone: "Phone", city: "City", bio: "Bio",
    category: "Category", specialties: "Specialties", availability: "Availability",
    notFilled: "Not filled in yet",
    timePerPage: "Time per page",
    page: "Page", totalTime: "Total time", visits: "Visits",
    noPageTime: "No time data yet",
    allActivity: "All activity",
    event: "Event", detail: "Detail", date: "Date",
    limitNote: (n: number) => `Last ${n} events`,
  },
};

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

export default function VisitorDetailView({ visitor }: { visitor: AdminVisitorDetail }) {
  const { dark, lang } = useSite();
  const t = TX[lang];

  const CARD   = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT   = dark ? "#F5EEDB" : "#2B211D";
  const MUTED  = dark ? "#A99B8E" : "#6E5F55";
  const TH     = dark ? "#261C18" : "#F1E8D2";

  const name = visitor.handle ?? visitor.fullName
    ?? (visitor.userId ? visitor.userId.slice(0, 8) : `${t.guest} · ${visitor.sessionId.slice(0, 8)}`);

  const times = visitor.events.map((e) => new Date(e.createdAt).getTime());
  const firstSeen = times.length ? new Date(Math.min(...times)) : null;
  const lastSeen  = times.length ? new Date(Math.max(...times)) : null;
  const locale = lang === "ar" ? "ar-EG" : "en-GB";

  return (
    <AdminShell title={name}>
      <Link
        href="/admin/user-activity"
        style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, textDecoration: "none", fontSize: 14, marginBottom: 20 }}
      >
        <ArrowLeft size={16} />{t.back}
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{t.firstSeen}</p>
          <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 700, color: TEXT }}>{firstSeen ? firstSeen.toLocaleString(locale) : "—"}</p>
        </div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{t.lastSeen}</p>
          <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 700, color: TEXT }}>{lastSeen ? lastSeen.toLocaleString(locale) : "—"}</p>
        </div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{t.totalEvents}</p>
          <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 700, color: TEXT }}>{visitor.events.length}</p>
        </div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{t.registeredYes}</p>
          <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 700, color: visitor.registered ? "#087F83" : MUTED }}>
            {visitor.registered ? t.registeredYes : t.registeredNo}
          </p>
        </div>
      </div>

      {visitor.profileData && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <p style={{ margin: 0, padding: "14px 16px", fontSize: 14, fontWeight: 600, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
            {t.profileData}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 0 }}>
            {([
              [t.role,         visitor.profileData.role],
              [t.phone,        visitor.profileData.phoneNumber],
              [t.city,         visitor.profileData.city],
              [t.bio,          visitor.profileData.bio],
              ...(visitor.profileData.role === "talent" ? [
                [t.category,     visitor.profileData.category] as const,
                [t.specialties,  visitor.profileData.specialties?.join("، ") ?? null] as const,
                [t.availability, visitor.profileData.availability] as const,
              ] : []),
            ] as const).map(([label, value]) => (
              <div key={label} style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}` }}>
                <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, fontWeight: 600, color: value ? TEXT : MUTED, fontStyle: value ? "normal" : "italic" }}>
                  {value || t.notFilled}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
        <p style={{ margin: 0, padding: "14px 16px", fontSize: 14, fontWeight: 600, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
          {t.timePerPage}
        </p>
        {visitor.pageTotals.length === 0 ? (
          <EmptyState message={t.noPageTime} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: TH }}>
                  {[t.page, t.totalTime, t.visits].map((h) => (
                    <th key={h} style={{ textAlign: "start", padding: "10px 16px", color: MUTED, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visitor.pageTotals.map((p) => (
                  <tr key={p.path} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "10px 16px", color: TEXT, direction: "ltr", textAlign: lang === "ar" ? "right" : "left" }}>{p.path}</td>
                    <td style={{ padding: "10px 16px", color: TEXT, fontWeight: 600 }}>{formatMs(p.totalMs)}</td>
                    <td style={{ padding: "10px 16px", color: MUTED }}>{p.visitCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
        <p style={{ margin: 0, padding: "14px 16px", fontSize: 14, fontWeight: 600, color: TEXT, borderBottom: `1px solid ${BORDER}` }}>
          {t.allActivity} — {t.limitNote(visitor.events.length)}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: TH }}>
                {[t.event, t.detail, t.date].map((h) => (
                  <th key={h} style={{ textAlign: "start", padding: "10px 16px", color: MUTED, fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visitor.events.map((e) => (
                <tr key={e.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ color: EVENT_COLOR[e.eventName], fontWeight: 600 }}>{EVENT_LABEL[lang][e.eventName]}</span>
                  </td>
                  <td style={{ padding: "10px 16px", color: TEXT, maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detailFor(e, lang)}</td>
                  <td style={{ padding: "10px 16px", color: MUTED }}>{new Date(e.createdAt).toLocaleString(locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
