"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";

const TX = { ar: { title: "لوحة التحكم" }, en: { title: "Dashboard" } };

// Sidebar + topbar — rendered immediately, never suspended. Only the stats
// grid (children, wrapped in <Suspense> by page.tsx) shows a skeleton.
export default function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const { lang } = useSite();
  return <AdminShell title={TX[lang].title}>{children}</AdminShell>;
}
