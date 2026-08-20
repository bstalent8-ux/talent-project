// ─── Notification templates & presentation metadata ──────────────────────────
// A notification row stores ONE title/message pair, but the platform is
// bilingual. Rather than adding title_ar/title_en columns (and forcing every
// future field to double), we store the Arabic copy in `title`/`message` — so
// the row stays human-readable in the SQL editor and in the admin log — and
// stash the full bilingual pair under `metadata.i18n`.
//
// The UI reads `metadata.i18n[lang]` and falls back to `title`/`message`, so
// rows written before this system (or typed by hand in the admin composer in a
// single language) still render correctly.

import type {
  NotificationMetadata,
  NotificationPriority,
  NotificationType,
} from "./types";

export interface BilingualText {
  ar: string;
  en: string;
}

export interface BilingualContent {
  title:   BilingualText;
  message: BilingualText;
}

export interface NotificationI18n {
  ar: { title: string; message: string };
  en: { title: string; message: string };
}

/**
 * Merge a bilingual pair into the metadata blob the UI reads.
 * Arabic is the canonical column value (see file header).
 */
export function withI18n(
  content: BilingualContent,
  metadata: NotificationMetadata = {}
): { title: string; message: string; metadata: NotificationMetadata } {
  const i18n: NotificationI18n = {
    ar: { title: content.title.ar, message: content.message.ar },
    en: { title: content.title.en, message: content.message.en },
  };
  return {
    title:    content.title.ar,
    message:  content.message.ar,
    metadata: { ...metadata, i18n },
  };
}

/** Reverse of `withI18n` — used by every renderer. */
export function readI18n(
  n: { title: string; message: string; metadata?: NotificationMetadata | null },
  lang: "ar" | "en"
): { title: string; message: string } {
  const i18n = n.metadata?.i18n as NotificationI18n | undefined;
  const side = i18n?.[lang];
  if (side?.title && side?.message) return { title: side.title, message: side.message };
  return { title: n.title, message: n.message };
}

// ─── Presentation: icon + accent colour per type ─────────────────────────────

export const TYPE_ICON: Record<NotificationType, string> = {
  JOB_CREATED:              "📢",
  JOB_APPLICATION_RECEIVED: "📋",
  APPLICATION_ACCEPTED:     "✅",
  APPLICATION_REJECTED:     "❌",
  BOOKING_REQUEST:          "📄",
  BOOKING_ACCEPTED:         "🤝",
  BOOKING_DECLINED:         "🚫",
  BOOKING_UPDATED:          "📅",
  DELIVERABLE_SUBMITTED:    "📦",
  CHAT_MESSAGE:             "💬",
  NEW_REVIEW:               "⭐",
  PROFILE_APPROVED:         "🎉",
  PROFILE_REJECTED:         "⚠️",
  SUBSCRIPTION_UPDATED:     "💎",
  PAYMENT_SUCCESS:          "💳",
  PAYMENT_FAILED:           "🔴",
  SYSTEM:                   "🔔",
  ADMIN_MESSAGE:            "📣",
  GENERAL:                  "🔔",
  TESTIMONIAL_SUBMITTED:    "💬",
  BRAND_MOMENT_SUBMITTED:   "📸",
  SUPPORT_TICKET_SUBMITTED: "🆘",
};

export const TYPE_COLOR: Record<NotificationType, string> = {
  JOB_CREATED:              "#8B5CF6",
  JOB_APPLICATION_RECEIVED: "#8B5CF6",
  APPLICATION_ACCEPTED:     "#00D26A",
  APPLICATION_REJECTED:     "#EF4444",
  BOOKING_REQUEST:          "#F59E0B",
  BOOKING_ACCEPTED:         "#00D26A",
  BOOKING_DECLINED:         "#EF4444",
  BOOKING_UPDATED:          "#10B981",
  DELIVERABLE_SUBMITTED:    "#0EA5E9",
  CHAT_MESSAGE:             "#0EA5E9",
  NEW_REVIEW:               "#F97316",
  PROFILE_APPROVED:         "#00D26A",
  PROFILE_REJECTED:         "#EF4444",
  SUBSCRIPTION_UPDATED:     "#6366F1",
  PAYMENT_SUCCESS:          "#EC4899",
  PAYMENT_FAILED:           "#EF4444",
  SYSTEM:                   "#6B7280",
  ADMIN_MESSAGE:            "#6366F1",
  GENERAL:                  "#6B7280",
  TESTIMONIAL_SUBMITTED:    "#16a3a3",
  BRAND_MOMENT_SUBMITTED:   "#16a3a3",
  SUPPORT_TICKET_SUBMITTED: "#EF4444",
};

export const PRIORITY_COLOR: Record<NotificationPriority, string> = {
  low:    "#94A3B8",
  normal: "#0EA5E9",
  high:   "#F59E0B",
  urgent: "#EF4444",
};

export const TYPE_LABEL: Record<NotificationType, BilingualText> = {
  JOB_CREATED:              { ar: "وظيفة جديدة",       en: "New job" },
  JOB_APPLICATION_RECEIVED: { ar: "طلب تقديم",         en: "Application" },
  APPLICATION_ACCEPTED:     { ar: "تم القبول",         en: "Accepted" },
  APPLICATION_REJECTED:     { ar: "تم الرفض",          en: "Rejected" },
  BOOKING_REQUEST:          { ar: "طلب حجز",           en: "Booking request" },
  BOOKING_ACCEPTED:         { ar: "حجز مقبول",         en: "Booking accepted" },
  BOOKING_DECLINED:         { ar: "حجز مرفوض",         en: "Booking declined" },
  BOOKING_UPDATED:          { ar: "تحديث الحجز",       en: "Booking update" },
  DELIVERABLE_SUBMITTED:    { ar: "تسليم جديد",        en: "Deliverable" },
  CHAT_MESSAGE:             { ar: "رسالة",             en: "Message" },
  NEW_REVIEW:               { ar: "تقييم جديد",        en: "New review" },
  PROFILE_APPROVED:         { ar: "الملف معتمد",       en: "Profile approved" },
  PROFILE_REJECTED:         { ar: "الملف مرفوض",       en: "Profile rejected" },
  SUBSCRIPTION_UPDATED:     { ar: "تحديث الاشتراك",    en: "Subscription" },
  PAYMENT_SUCCESS:          { ar: "دفعة ناجحة",        en: "Payment" },
  PAYMENT_FAILED:           { ar: "فشل الدفع",         en: "Payment failed" },
  SYSTEM:                   { ar: "النظام",            en: "System" },
  ADMIN_MESSAGE:            { ar: "إدارة المنصة",      en: "Announcement" },
  GENERAL:                  { ar: "عام",               en: "General" },
  TESTIMONIAL_SUBMITTED:    { ar: "رأي جديد",          en: "New testimonial" },
  BRAND_MOMENT_SUBMITTED:   { ar: "لحظة براند جديدة",  en: "New brand moment" },
  SUPPORT_TICKET_SUBMITTED: { ar: "تذكرة دعم جديدة",   en: "New support ticket" },
};

export const DEFAULT_PRIORITY: Record<NotificationType, NotificationPriority> = {
  JOB_CREATED:              "normal",
  JOB_APPLICATION_RECEIVED: "high",
  APPLICATION_ACCEPTED:     "high",
  APPLICATION_REJECTED:     "normal",
  BOOKING_REQUEST:          "high",
  BOOKING_ACCEPTED:         "high",
  BOOKING_DECLINED:         "normal",
  BOOKING_UPDATED:          "normal",
  DELIVERABLE_SUBMITTED:    "high",
  CHAT_MESSAGE:             "normal",
  NEW_REVIEW:               "normal",
  PROFILE_APPROVED:         "high",
  PROFILE_REJECTED:         "high",
  SUBSCRIPTION_UPDATED:     "normal",
  PAYMENT_SUCCESS:          "high",
  PAYMENT_FAILED:           "urgent",
  SYSTEM:                   "normal",
  ADMIN_MESSAGE:            "high",
  GENERAL:                  "normal",
  TESTIMONIAL_SUBMITTED:    "normal",
  BRAND_MOMENT_SUBMITTED:   "normal",
  SUPPORT_TICKET_SUBMITTED: "high",
};

/**
 * Fallback destination when a notification carries no explicit `action_url`.
 * Every event helper sets one, so this only covers hand-written admin blasts
 * and rows migrated from v1.
 */
export function fallbackActionUrl(
  type: NotificationType,
  metadata: NotificationMetadata = {}
): string | null {
  const ref = metadata.reference_id;
  switch (type) {
    case "CHAT_MESSAGE":
      return metadata.conversation_id ? `/chat/${metadata.conversation_id}` : "/chat";
    case "JOB_CREATED":
      return metadata.job_id ? `/jobs/${metadata.job_id}` : "/jobs";
    case "JOB_APPLICATION_RECEIVED":
      return metadata.job_id ? `/jobs/${metadata.job_id}/applications` : "/jobs";
    case "APPLICATION_ACCEPTED":
    case "APPLICATION_REJECTED":
      return metadata.job_id ? `/jobs/${metadata.job_id}` : "/jobs";
    case "BOOKING_REQUEST":
    case "BOOKING_ACCEPTED":
    case "BOOKING_DECLINED":
    case "BOOKING_UPDATED":
    case "DELIVERABLE_SUBMITTED":
    case "PAYMENT_SUCCESS":
    case "PAYMENT_FAILED":
      return metadata.booking_id ? `/bookings/${metadata.booking_id}` : "/bookings";
    case "NEW_REVIEW":
    case "PROFILE_APPROVED":
    case "PROFILE_REJECTED":
      return "/profile/me";
    case "SUBSCRIPTION_UPDATED":
      return "/packages";
    default:
      return ref ? null : null;
  }
}
