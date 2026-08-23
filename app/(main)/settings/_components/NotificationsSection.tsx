"use client";
import Link from "next/link";
import { Bell, MessageCircle, CalendarCheck, CheckCircle2 } from "lucide-react";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import type { SectionProps } from "./SettingsClient";

const TX = {
  ar: {
    title: "الإشعارات",
    desc: "بتوصلك إشعارات داخل التطبيق تلقائيًا للأحداث دي:",
    newBrief: "بريف جديد", newMessage: "رسالة جديدة", bookingUpdate: "تحديث حالة الحجز", approval: "الموافقة أو الرفض",
    note: "خيارات التحكم في نوع الإشعارات (مثل إيقاف إشعارات البريد الإلكتروني) غير متاحة حاليًا.",
    unread: "إشعار غير مقروء",
    unreadPlural: "إشعارات غير مقروءة",
    viewAll: "عرض كل الإشعارات",
  },
  en: {
    title: "Notifications",
    desc: "You automatically receive in-app notifications for these events:",
    newBrief: "New Brief", newMessage: "New Message", bookingUpdate: "Booking Status Update", approval: "Approval / Rejection",
    note: "Per-type or email-notification controls aren't available yet.",
    unread: "unread notification",
    unreadPlural: "unread notifications",
    viewAll: "View all notifications",
  },
};

export default function NotificationsSection({ lang, dark }: SectionProps) {
  const t = TX[lang];
  const { unreadCount } = useNotifications();
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const GREEN  = "#00D26A";

  const events = [
    { icon: MessageCircle, label: t.newBrief },
    { icon: MessageCircle, label: t.newMessage },
    { icon: CalendarCheck, label: t.bookingUpdate },
    { icon: CheckCircle2,  label: t.approval },
  ];

  return (
    <div>
      <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>{t.title}</h2>
      <p style={{ color: MUTED, fontSize: 13, margin: "0 0 16px" }}>{t.desc}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18, maxWidth: 420 }}>
        {events.map((e) => (
          <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
            <e.icon size={15} color={GREEN} />
            <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{e.label}</span>
          </div>
        ))}
      </div>

      <p style={{ color: MUTED, fontSize: 11.5, lineHeight: 1.7, margin: "0 0 20px" }}>{t.note}</p>

      <Link href="/notifications" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", backgroundColor: GREEN, borderRadius: 10, color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
        <Bell size={15} />
        {t.viewAll}
        {unreadCount > 0 && (
          <span style={{ backgroundColor: "#000", color: GREEN, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 800 }}>{unreadCount}</span>
        )}
      </Link>
    </div>
  );
}
