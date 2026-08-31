"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck, Bell, Heart, MessageCircle, Settings, Eye,
  Star, TrendingUp, Briefcase,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { canonicalTalentPath } from "@/lib/talent-profile-route";
import type { CompletionDTO } from "@/features/profiles/types/dto";

interface Party { id: string; full_name: string | null; handle: string | null; avatar_url: string | null }
interface BookingRow {
  id: string; status: string; amount: number | null; created_at: string; service_type: string | null;
  brand?: Party | null; talent?: Party | null;
}
interface TalentProfileRow {
  id: string; category: string | null; status: string | null; avg_rating: number | null; total_reviews: number | null; profile_views: number | null;
}
interface ProfileRow { id: string; role: string; full_name: string | null; handle: string | null; city: string | null; avatar_url: string | null }

interface Props {
  role: "talent" | "brand";
  profile: ProfileRow;
  recentBookings: BookingRow[];
  talentProfile?: TalentProfileRow | null;
  brandStatus?: string;
}

const STATUS_LABEL: Record<string, { ar: string; en: string; color: string }> = {
  pending:          { ar: "قيد المراجعة",    en: "Pending",         color: "#F4B740" },
  contacting:       { ar: "تواصل",           en: "Contacting",      color: "#94a3b8" },
  brief_sent:       { ar: "إرسال البريف",    en: "Brief Sent",      color: "#60a5fa" },
  accepted:         { ar: "مقبول",           en: "Accepted",        color: "#a78bfa" },
  payment_pending:  { ar: "انتظار دفع",      en: "Payment Pending", color: "#F4B740" },
  in_progress:      { ar: "جاري التنفيذ",    en: "In Progress",     color: "#fb923c" },
  completed:        { ar: "مكتمل",           en: "Completed",       color: "#00D26A" },
  paid:             { ar: "تم الدفع",        en: "Paid",            color: "#00D26A" },
  rejected:         { ar: "مرفوض",           en: "Rejected",        color: "#EF4444" },
  cancelled:        { ar: "ملغي",            en: "Cancelled",       color: "#EF4444" },
};

const TX = {
  ar: {
    dashboard: "لوحة التحكم",
    welcome: (name: string) => `أهلاً، ${name}`,
    completion: "اكتمال الملف الشخصي",
    completeNow: "أكمل ملفك",
    viewPublic: "عرض الملف العام",
    recentBookings: "آخر الحجوزات",
    noBookings: "لا توجد حجوزات بعد",
    notifications: "الإشعارات",
    unread: "غير مقروءة",
    viewAll: "عرض الكل",
    quickLinks: "روابط سريعة",
    messages: "الرسائل",
    favorites: "المفضلة",
    settings: "الإعدادات",
    rating: "التقييم",
    reviews: "تقييم",
    views: "مشاهدة",
    brandStatusLabel: "حالة الحساب",
    brandStatus: { pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض" } as Record<string, string>,
    findTalent: "استكشاف المواهب",
    postJob: "نشر وظيفة",
    amount: "المبلغ",
    noAmount: "—",
  },
  en: {
    dashboard: "Dashboard",
    welcome: (name: string) => `Welcome, ${name}`,
    completion: "Profile Completion",
    completeNow: "Complete your profile",
    viewPublic: "View Public Profile",
    recentBookings: "Recent Bookings",
    noBookings: "No bookings yet",
    notifications: "Notifications",
    unread: "unread",
    viewAll: "View all",
    quickLinks: "Quick Links",
    messages: "Messages",
    favorites: "Favorites",
    settings: "Settings",
    rating: "Rating",
    reviews: "reviews",
    views: "views",
    brandStatusLabel: "Account Status",
    brandStatus: { pending: "Pending Review", approved: "Approved", rejected: "Rejected" } as Record<string, string>,
    findTalent: "Explore Talents",
    postJob: "Post a Job",
    amount: "Amount",
    noAmount: "—",
  },
};

export default function DashboardClient({ role, profile, recentBookings, talentProfile, brandStatus }: Props) {
  const { dark, lang } = useSite();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const t = TX[lang];
  const ar = lang === "ar";

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const BG     = dark ? "#050B12" : "#F1F5F9";
  const GREEN  = "#00D26A";

  const [completion, setCompletion] = useState<CompletionDTO | null>(null);
  useEffect(() => {
    if (role !== "talent") return;
    fetch("/api/profile/completion")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setCompletion(j?.data ?? null))
      .catch(() => {});
  }, [role]);

  const displayName = profile.full_name || profile.handle || "";

  const cardStyle: React.CSSProperties = { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: isMobile ? 16 : 24 };
  const sectionTitle: React.CSSProperties = { color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 16px" };

  return (
    <main dir={ar ? "rtl" : "ltr"} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", backgroundColor: BG, minHeight: "100vh", paddingBottom: 60 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px" : "32px 24px" }}>
        <h1 style={{ color: TEXT, fontSize: isMobile ? 20 : 24, fontWeight: 900, margin: "0 0 4px" }}>{t.dashboard}</h1>
        <p style={{ color: MUTED, fontSize: 14, margin: "0 0 24px" }}>{t.welcome(displayName)}</p>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 20 }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {role === "talent" && (
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h2 style={sectionTitle as React.CSSProperties}>{t.completion}</h2>
                  {completion && <span style={{ color: GREEN, fontWeight: 800, fontSize: 18 }}>{completion.score}%</span>}
                </div>
                <div style={{ height: 8, borderRadius: 4, backgroundColor: dark ? "#0a121c" : "#f1f5f9", overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: `${completion?.score ?? 0}%`, backgroundColor: GREEN, borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href="/profile/me/complete" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: GREEN, borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                    {t.completeNow}
                  </Link>
                  {profile.handle && (
                    <a href={canonicalTalentPath(talentProfile?.category ?? null, profile.handle)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: "transparent", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                      <Eye size={14} />{t.viewPublic}
                    </a>
                  )}
                </div>
                {talentProfile && (
                  <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Star size={14} color="#F4B740" fill="#F4B740" />
                      <span style={{ color: TEXT, fontWeight: 700, fontSize: 13 }}>{talentProfile.avg_rating ? Number(talentProfile.avg_rating).toFixed(1) : "—"}</span>
                      <span style={{ color: MUTED, fontSize: 12 }}>({talentProfile.total_reviews ?? 0} {t.reviews})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontSize: 12 }}>
                      <Eye size={13} /><span>{talentProfile.profile_views ?? 0} {t.views}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {role === "brand" && (
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 style={sectionTitle as React.CSSProperties}>{t.brandStatusLabel}</h2>
                  <span style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    backgroundColor: brandStatus === "approved" ? "rgba(0,210,106,0.15)" : brandStatus === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(244,183,64,0.15)",
                    color: brandStatus === "approved" ? GREEN : brandStatus === "rejected" ? "#EF4444" : "#F4B740",
                  }}>
                    {t.brandStatus[brandStatus ?? "approved"] ?? brandStatus}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  <Link href="/explore" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: GREEN, borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                    <TrendingUp size={14} />{t.findTalent}
                  </Link>
                  <Link href="/jobs/create" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: "transparent", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    <Briefcase size={14} />{t.postJob}
                  </Link>
                </div>
              </div>
            )}

            {/* Recent bookings */}
            <div style={cardStyle}>
              <h2 style={sectionTitle as React.CSSProperties}>{t.recentBookings}</h2>
              {recentBookings.length === 0 ? (
                <p style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: "24px 0" }}>{t.noBookings}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recentBookings.map((b) => {
                    const other = role === "brand" ? b.talent : b.brand;
                    const meta = STATUS_LABEL[b.status] ?? { ar: b.status, en: b.status, color: MUTED };
                    return (
                      <Link
                        key={b.id}
                        href={`/bookings/${b.id}`}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                          padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, textDecoration: "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: BORDER, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 13, fontWeight: 700 }}>
                            {(other?.full_name ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {other?.full_name ?? "—"}
                            </p>
                            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>
                              {new Date(b.created_at).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                              {b.amount ? ` · ${t.amount}: ${b.amount.toLocaleString()}` : ""}
                            </p>
                          </div>
                        </div>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: `${meta.color}22`, color: meta.color, whiteSpace: "nowrap" }}>
                          {meta[lang]}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={cardStyle}>
              <h2 style={sectionTitle as React.CSSProperties}>{t.notifications}</h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={18} color={unreadCount > 0 ? GREEN : MUTED} />
                  <span style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>
                    {unreadCount} {t.unread}
                  </span>
                </div>
                <Link href="/notifications" style={{ color: GREEN, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  {t.viewAll}
                </Link>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitle as React.CSSProperties}>{t.quickLinks}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/chat" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <MessageCircle size={15} color={GREEN} />{t.messages}
                </Link>
                <Link href="/favorites" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <Heart size={15} color={GREEN} />{t.favorites}
                </Link>
                <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <Settings size={15} color={GREEN} />{t.settings}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
