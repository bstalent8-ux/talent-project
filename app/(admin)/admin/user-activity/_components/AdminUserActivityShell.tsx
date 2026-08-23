"use client";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import { USER_EVENT_NAMES, type UserEventName } from "@/features/admin/services/admin.service";

const TX = {
  ar: {
    title: "نشاط المستخدمين",
    subtitle: "تتبع داخلي لأفعال الزوار والمستخدمين — page views، زيارات البروفايل، بحث، تسجيل، دخول.",
    from: "من", to: "إلى", event: "النوع", all: "الكل",
    page_view: "زيارة صفحة", talent_profile_view: "زيارة بروفايل", search: "بحث",
    booking_brief_sent: "طلب حجز", job_application: "تقديم وظيفة", signup: "تسجيل", login: "دخول",
  },
  en: {
    title: "User Activity",
    subtitle: "In-house tracking of visitor/user actions — page views, profile views, search, signup, login.",
    from: "From", to: "To", event: "Type", all: "All",
    page_view: "Page view", talent_profile_view: "Profile view", search: "Search",
    booking_brief_sent: "Booking brief", job_application: "Job application", signup: "Signup", login: "Login",
  },
};

function buildHref(from: string, to: string, eventName: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (eventName) params.set("event", eventName);
  const qs = params.toString();
  return qs ? `/admin/user-activity?${qs}` : "/admin/user-activity";
}

// Sidebar + topbar + date-range/event filters — rendered immediately, never
// suspended, mirroring AdminTalentDemandShell. Changing a filter navigates
// (resets page to 1 implicitly) while only the stats/table area (children,
// wrapped in <Suspense> by page.tsx) shows a skeleton.
export default function AdminUserActivityShell({
  from = "",
  to = "",
  eventName = "",
  children,
}: {
  from?: string;
  to?: string;
  eventName?: string;
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
          {t.from}
          <input
            type="date"
            defaultValue={from}
            onChange={(e) => router.push(buildHref(e.target.value, to, eventName))}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT, fontSize: 13 }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: MUTED }}>
          {t.to}
          <input
            type="date"
            defaultValue={to}
            onChange={(e) => router.push(buildHref(from, e.target.value, eventName))}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT, fontSize: 13 }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: MUTED }}>
          {t.event}
          <select
            defaultValue={eventName}
            onChange={(e) => router.push(buildHref(from, to, e.target.value))}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: TEXT, fontSize: 13 }}
          >
            <option value="">{t.all}</option>
            {(USER_EVENT_NAMES as readonly UserEventName[]).map((name) => (
              <option key={name} value={name}>{t[name]}</option>
            ))}
          </select>
        </label>
      </div>

      {children}
    </AdminShell>
  );
}
