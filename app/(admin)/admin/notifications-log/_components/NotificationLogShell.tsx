"use client";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";

const TX = {
  ar: { title: "سجل الإشعارات" },
  en: { title: "Notification Log" },
};

// Distinct from /admin/notifications (the broadcast composer) — this is a
// read-only view over every row ever written to `notifications`, individual
// sends (PROFILE_APPROVED, BOOKING_REQUEST, ...) and broadcasts alike. Mirrors
// /admin/emails' shape.
export default function NotificationLogShell({ children }: { children: React.ReactNode }) {
  const { lang } = useSite();
  const t = TX[lang];
  return <AdminShell title={t.title}>{children}</AdminShell>;
}
