"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import DashboardCard from "@/components/admin/DashboardCard";
import type { AdminDashboardStats } from "@/features/admin/types";
import { Users, CheckCircle, XCircle, PauseCircle, Building2, CalendarCheck, Star } from "lucide-react";

const TX = {
  ar: {
    title: "لوحة التحكم",
    pending:   "بانتظار الموافقة",
    approved:  "مواهب معتمدة",
    rejected:  "مرفوضة",
    suspended: "موقوفة",
    brands:    "الشركات",
    bookings:  "الحجوزات",
    reviews:   "التقييمات",
  },
  en: {
    title: "Dashboard",
    pending:   "Pending Approval",
    approved:  "Approved Talents",
    rejected:  "Rejected",
    suspended: "Suspended",
    brands:    "Brands",
    bookings:  "Bookings",
    reviews:   "Reviews",
  },
};

export default function AdminDashboardClient({ stats }: { stats: AdminDashboardStats }) {
  const { lang } = useSite();
  const t = TX[lang];

  return (
    <AdminShell title={t.title}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <DashboardCard label={t.pending}   value={stats.pending}   color="#F4B740" icon={<Users size={20} />} />
        <DashboardCard label={t.approved}  value={stats.approved}  color="#00D26A" icon={<CheckCircle size={20} />} />
        <DashboardCard label={t.rejected}  value={stats.rejected}  color="#EF4444" icon={<XCircle size={20} />} />
        <DashboardCard label={t.suspended} value={stats.suspended} color="#94A3B8" icon={<PauseCircle size={20} />} />
        <DashboardCard label={t.brands}    value={stats.brands}    color="#60A5FA" icon={<Building2 size={20} />} />
        <DashboardCard label={t.bookings}  value={stats.bookings}  color="#A78BFA" icon={<CalendarCheck size={20} />} />
        <DashboardCard label={t.reviews}   value={stats.reviews}   color="#F472B6" icon={<Star size={20} />} />
      </div>
    </AdminShell>
  );
}
