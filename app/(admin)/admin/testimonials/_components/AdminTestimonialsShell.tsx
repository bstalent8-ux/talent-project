"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";

const TX = { ar: { title: "آراء الصفحة الرئيسية" }, en: { title: "Home Page Testimonials" } };

// Sidebar + topbar — rendered immediately, never suspended.
export default function AdminTestimonialsShell({ children }: { children: React.ReactNode }) {
  const { lang } = useSite();
  return <AdminShell title={TX[lang].title}>{children}</AdminShell>;
}
