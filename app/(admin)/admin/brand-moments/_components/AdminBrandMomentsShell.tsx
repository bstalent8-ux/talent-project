"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";

const TX = { ar: { title: "لحظات البراندات — الصفحة الرئيسية" }, en: { title: "Brand Moments — Home Page" } };

// Sidebar + topbar — rendered immediately, never suspended.
export default function AdminBrandMomentsShell({ children }: { children: React.ReactNode }) {
  const { lang } = useSite();
  return <AdminShell title={TX[lang].title}>{children}</AdminShell>;
}
