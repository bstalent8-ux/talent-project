"use client";
import { useSite } from "@/contexts/SiteContext";
import DashboardCard from "@/components/admin/DashboardCard";
import type { AdminDashboardStats } from "@/features/admin/types";
import { formatTalentTag } from "@/lib/talent-tags";
import { Users, CheckCircle, XCircle, PauseCircle, Building2, CalendarCheck, Star, UserPlus, Video, Sparkles } from "lucide-react";

// Icon + color per known category, cycling through a small neutral palette
// for anything the platform adds later that isn't ugc/model — see
// AdminDashboardStats.byCategory's doc comment for why this is dynamic.
const CATEGORY_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  ugc:   { color: "#F97316", icon: <Video size={20} /> },
  model: { color: "#8B5CF6", icon: <Sparkles size={20} /> },
};
const FALLBACK_CATEGORY_COLORS = ["#22D3EE", "#FB923C", "#4ADE80", "#F472B6", "#A78BFA"];

const TX = {
  ar: {
    pending:          "بانتظار الموافقة",
    approved:         "مواهب معتمدة",
    rejected:         "مرفوضة",
    suspended:        "موقوفة",
    brands:           "الشركات",
    bookings:         "الحجوزات",
    reviews:          "التقييمات",
    newRegistrations: "تسجيلات جديدة",
  },
  en: {
    pending:          "Pending Approval",
    approved:         "Approved Talents",
    rejected:         "Rejected",
    suspended:        "Suspended",
    brands:           "Brands",
    bookings:         "Bookings",
    reviews:          "Reviews",
    newRegistrations: "New Registrations",
  },
};

export default function DashboardStatsGrid({ stats }: { stats: AdminDashboardStats }) {
  const { lang } = useSite();
  const t = TX[lang];
  const categories = Object.entries(stats.byCategory ?? {}).sort(([, a], [, b]) => b - a);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
      }}
    >
      <DashboardCard label={t.newRegistrations} value={stats.newRegistrations} color="#00D2D3" icon={<UserPlus size={20} />} />
      <DashboardCard label={t.pending}   value={stats.pending}   color="#F4B740" icon={<Users size={20} />} />
      <DashboardCard label={t.approved}  value={stats.approved}  color="#00D26A" icon={<CheckCircle size={20} />} />
      <DashboardCard label={t.rejected}  value={stats.rejected}  color="#EF4444" icon={<XCircle size={20} />} />
      <DashboardCard label={t.suspended} value={stats.suspended} color="#94A3B8" icon={<PauseCircle size={20} />} />
      <DashboardCard label={t.brands}    value={stats.brands}    color="#60A5FA" icon={<Building2 size={20} />} />
      <DashboardCard label={t.bookings}  value={stats.bookings}  color="#A78BFA" icon={<CalendarCheck size={20} />} />
      <DashboardCard label={t.reviews}   value={stats.reviews}   color="#F472B6" icon={<Star size={20} />} />
      {categories.map(([category, count], i) => {
        const style = CATEGORY_STYLE[category] ?? {
          color: FALLBACK_CATEGORY_COLORS[i % FALLBACK_CATEGORY_COLORS.length],
          icon: <Users size={20} />,
        };
        return (
          <DashboardCard
            key={category}
            label={formatTalentTag(category, lang)}
            value={count}
            color={style.color}
            icon={style.icon}
          />
        );
      })}
    </div>
  );
}
