// ─── Notification domain types ───────────────────────────────────────────────
// Shared by the server service layer (lib/notifications/service.ts), the API
// routes (app/api/notifications/**) and the browser hooks (hooks/notifications).
// This file must stay import-free of `@/lib/supabase/admin` so client
// components can import the types without pulling the service-role key in.

export const NOTIFICATION_TYPES = [
  "JOB_CREATED",
  "JOB_APPLICATION_RECEIVED",
  "APPLICATION_ACCEPTED",
  "APPLICATION_REJECTED",
  "BOOKING_REQUEST",
  "BOOKING_ACCEPTED",
  "BOOKING_DECLINED",
  "BOOKING_UPDATED",
  "DELIVERABLE_SUBMITTED",
  "CHAT_MESSAGE",
  "NEW_REVIEW",
  "PROFILE_APPROVED",
  "PROFILE_REJECTED",
  "SUBSCRIPTION_UPDATED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "SYSTEM",
  "ADMIN_MESSAGE",
  "GENERAL",
  "TESTIMONIAL_SUBMITTED",
  "BRAND_MOMENT_SUBMITTED",
  "SUPPORT_TICKET_SUBMITTED",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

/** Free-form entity pointers. Every key is optional — add new ones freely. */
export interface NotificationMetadata {
  job_id?:         string;
  booking_id?:     string;
  application_id?: string;
  conversation_id?: string;
  review_id?:      string;
  payment_id?:     string;
  campaign_id?:    string;
  brand_id?:       string;
  talent_id?:      string;
  subscription_id?: string;
  /** Legacy v1 fields, folded in by the 20260730 migration. */
  reference_id?:   string;
  reference_type?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]:   any;
}

export interface Notification {
  id:           string;
  recipient_id: string;
  sender_id:    string | null;
  type:         NotificationType;
  title:        string;
  message:      string;
  action_url:   string | null;
  metadata:     NotificationMetadata;
  is_read:      boolean;
  read_at:      string | null;
  priority:     NotificationPriority;
  created_at:   string;
  expires_at:   string | null;
}

/** Columns selected everywhere. Keep in sync with `Notification`. */
export const NOTIFICATION_COLUMNS =
  "id, recipient_id, sender_id, type, title, message, action_url, metadata, is_read, read_at, priority, created_at, expires_at";

// ─── Audience ────────────────────────────────────────────────────────────────

export type NotificationAudienceMode =
  | "single"
  | "multiple"
  | "role"
  | "category"
  | "everyone";

export type NotificationAudience =
  | { mode: "single";   userId: string }
  | { mode: "multiple"; userIds: string[] }
  | { mode: "role";     roles: string[] }
  | { mode: "category"; categories: string[] }
  | { mode: "everyone" };

// ─── Service inputs ──────────────────────────────────────────────────────────

export interface NotificationContent {
  type:       NotificationType;
  title:      string;
  message:    string;
  actionUrl?: string | null;
  metadata?:  NotificationMetadata;
  priority?:  NotificationPriority;
  senderId?:  string | null;
  /** ISO timestamp. After this the notification is hidden by RLS and purged. */
  expiresAt?: string | null;
}

export interface CreateNotificationInput extends NotificationContent {
  recipientId: string;
}

export interface ListNotificationsOptions {
  page?:       number;
  pageSize?:   number;
  unreadOnly?: boolean;
  type?:       NotificationType;
}

export interface NotificationPage {
  notifications: Notification[];
  total:         number;
  page:          number;
  pageSize:      number;
  hasMore:       boolean;
  unreadCount:   number;
}

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === "string" && (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export function isNotificationPriority(value: unknown): value is NotificationPriority {
  return typeof value === "string" && (NOTIFICATION_PRIORITIES as readonly string[]).includes(value);
}
