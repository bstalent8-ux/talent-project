// ─── Notification service (SERVER ONLY) ──────────────────────────────────────
// Every write goes through the service role, so every caller is responsible for
// its own authorization check (see CLAUDE.md §3). Nothing in this file reads
// the current user — callers pass ids explicitly.
//
// Never import this from a "use client" file.

import { adminClient } from "@/lib/supabase/admin";
import {
  NOTIFICATION_COLUMNS,
  type CreateNotificationInput,
  type ListNotificationsOptions,
  type Notification,
  type NotificationAudience,
  type NotificationContent,
  type NotificationPage,
} from "./types";
import { DEFAULT_PRIORITY, fallbackActionUrl } from "./templates";

/** Supabase caps a single statement's payload; chunk large explicit lists. */
const BULK_CHUNK = 500;

function toRow(recipientId: string, c: NotificationContent, broadcastId?: string | null) {
  const metadata = c.metadata ?? {};
  return {
    recipient_id: recipientId,
    sender_id:    c.senderId ?? null,
    type:         c.type,
    title:        c.title,
    message:      c.message,
    action_url:   c.actionUrl ?? fallbackActionUrl(c.type, metadata),
    metadata,
    priority:     c.priority ?? DEFAULT_PRIORITY[c.type] ?? "normal",
    expires_at:   c.expiresAt ?? null,
    is_read:      false,
    ...(broadcastId ? { broadcast_id: broadcastId } : {}),
  };
}

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Insert one notification.
 * Failures are logged and swallowed — a notification must never break the
 * business flow that triggered it.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification | null> {
  if (!input.recipientId) return null;

  const { data, error } = await adminClient
    .from("notifications")
    .insert(toRow(input.recipientId, input))
    .select(NOTIFICATION_COLUMNS)
    .single();

  if (error) {
    console.error("[notifications] createNotification failed:", error.message);
    return null;
  }
  return data as unknown as Notification;
}

/**
 * Insert the same notification for an explicit list of recipients.
 * Duplicates are removed and the list is chunked. Returns the number written.
 */
export async function createBulkNotifications(
  recipientIds: string[],
  content: NotificationContent,
  broadcastId?: string | null
): Promise<number> {
  const unique = Array.from(new Set(recipientIds.filter(Boolean)));
  if (unique.length === 0) return 0;

  let written = 0;
  for (let i = 0; i < unique.length; i += BULK_CHUNK) {
    const chunk = unique.slice(i, i + BULK_CHUNK);
    const { error, count } = await adminClient
      .from("notifications")
      .insert(chunk.map((id) => toRow(id, content, broadcastId)), { count: "exact" });

    if (error) {
      console.error("[notifications] createBulkNotifications chunk failed:", error.message);
      continue;
    }
    written += count ?? chunk.length;
  }
  return written;
}

/**
 * Set-based fan-out via the `fan_out_notification` SQL function — one round
 * trip regardless of audience size, and recipient ids never travel to the
 * Worker. Used for role / category / everyone blasts.
 */
async function fanOut(
  audience: NotificationAudience,
  content: NotificationContent,
  broadcastId?: string | null,
  excludeSelf = true
): Promise<number> {
  const metadata = content.metadata ?? {};

  const { data, error } = await adminClient.rpc("fan_out_notification", {
    p_type:         content.type,
    p_title:        content.title,
    p_message:      content.message,
    p_audience:     audience.mode,
    p_sender_id:    content.senderId ?? null,
    p_action_url:   content.actionUrl ?? fallbackActionUrl(content.type, metadata),
    p_metadata:     metadata,
    p_priority:     content.priority ?? DEFAULT_PRIORITY[content.type] ?? "normal",
    p_expires_at:   content.expiresAt ?? null,
    p_user_ids:     audience.mode === "single"   ? [audience.userId]
                  : audience.mode === "multiple" ? audience.userIds
                  : null,
    p_roles:        audience.mode === "role"     ? audience.roles      : null,
    p_categories:   audience.mode === "category" ? audience.categories : null,
    p_broadcast_id: broadcastId ?? null,
    p_exclude_self: excludeSelf,
  });

  if (error) {
    console.error("[notifications] fanOut failed:", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

/** Notify every active user holding any of the given `profiles.role` values. */
export async function notifyRole(
  roles: string[],
  content: NotificationContent,
  broadcastId?: string | null
): Promise<number> {
  if (roles.length === 0) return 0;
  return fanOut({ mode: "role", roles }, content, broadcastId);
}

/** Notify every active user assigned to any of the given marketplace categories. */
export async function notifyCategory(
  categories: string[],
  content: NotificationContent,
  broadcastId?: string | null
): Promise<number> {
  if (categories.length === 0) return 0;
  return fanOut({ mode: "category", categories }, content, broadcastId);
}

/** Notify every active user. Excludes the sender. */
export async function notifyEveryone(
  content: NotificationContent,
  broadcastId?: string | null
): Promise<number> {
  return fanOut({ mode: "everyone" }, content, broadcastId);
}

/**
 * Single entry point used by the admin composer: resolves any audience shape to
 * the cheapest correct strategy.
 */
export async function dispatchNotification(
  audience: NotificationAudience,
  content: NotificationContent,
  broadcastId?: string | null
): Promise<number> {
  switch (audience.mode) {
    case "single":
      // Routed through the bulk path so `broadcast_id` is stamped on the row
      // and the admin log can report on a one-off send too.
      return createBulkNotifications([audience.userId], content, broadcastId);
    case "multiple":
      // Explicit lists skip the fan-out function: the ids are already known and
      // a plain bulk INSERT avoids the extra profiles scan.
      return createBulkNotifications(audience.userIds, content, broadcastId);
    case "role":
      return notifyRole(audience.roles, content, broadcastId);
    case "category":
      return notifyCategory(audience.categories, content, broadcastId);
    case "everyone":
      return notifyEveryone(content, broadcastId);
    default:
      return 0;
  }
}

/** Dry-run recipient count for the admin composer preview. */
export async function countAudience(audience: NotificationAudience): Promise<number> {
  if (audience.mode === "single") return 1;

  const { data, error } = await adminClient.rpc("count_notification_audience", {
    p_audience:   audience.mode,
    p_user_ids:   audience.mode === "multiple" ? audience.userIds : null,
    p_roles:      audience.mode === "role"     ? audience.roles      : null,
    p_categories: audience.mode === "category" ? audience.categories : null,
  });

  if (error) {
    console.error("[notifications] countAudience failed:", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

// ─── Read / mutate (always scoped to a user id) ──────────────────────────────

export async function listNotifications(
  userId: string,
  options: ListNotificationsOptions = {}
): Promise<NotificationPage> {
  const page     = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 20));
  const from     = (page - 1) * pageSize;
  const nowIso   = new Date().toISOString();

  let query = adminClient
    .from("notifications")
    .select(NOTIFICATION_COLUMNS, { count: "exact" })
    .eq("recipient_id", userId)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .order("id",         { ascending: false })
    .range(from, from + pageSize - 1);

  if (options.unreadOnly) query = query.eq("is_read", false);
  if (options.type)       query = query.eq("type", options.type);

  const [{ data, error, count }, unreadCount] = await Promise.all([
    query,
    getUnreadCount(userId),
  ]);

  if (error) {
    console.error("[notifications] listNotifications failed:", error.message);
    return { notifications: [], total: 0, page, pageSize, hasMore: false, unreadCount: 0 };
  }

  const total = count ?? 0;
  return {
    notifications: (data ?? []) as unknown as Notification[],
    total,
    page,
    pageSize,
    hasMore: from + pageSize < total,
    unreadCount,
  };
}

/**
 * Count of unread, unexpired notifications. Served by the partial index
 * `idx_notifications_recipient_unread` — head-only, no rows transferred.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const nowIso = new Date().toISOString();
  const { count, error } = await adminClient
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  if (error) {
    console.error("[notifications] getUnreadCount failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

/** Ownership is enforced by the `recipient_id` predicate, not just by the id. */
export async function markAsRead(userId: string, notificationId: string): Promise<boolean> {
  const { data, error } = await adminClient
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", userId)
    .eq("is_read", false)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[notifications] markAsRead failed:", error.message);
    return false;
  }
  if (data) return true;

  const { data: existing, error: existingError } = await adminClient
    .from("notifications")
    .select("id")
    .eq("id", notificationId)
    .eq("recipient_id", userId)
    .maybeSingle();

  if (existingError) {
    console.error("[notifications] markAsRead ownership check failed:", existingError.message);
    return false;
  }
  return !!existing;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const { error, count } = await adminClient
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() }, { count: "exact" })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("[notifications] markAllAsRead failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function deleteNotification(userId: string, notificationId: string): Promise<boolean> {
  const { data, error } = await adminClient
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("recipient_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[notifications] deleteNotification failed:", error.message);
    return false;
  }
  return !!data;
}

// ─── Broadcast audit log ─────────────────────────────────────────────────────

export async function recordBroadcast(input: {
  senderId:  string | null;
  audience:  NotificationAudience;
  content:   NotificationContent;
}): Promise<string | null> {
  const { audience, content, senderId } = input;

  const filter =
      audience.mode === "single"   ? { user_ids: [audience.userId] }
    : audience.mode === "multiple" ? { user_ids: audience.userIds }
    : audience.mode === "role"     ? { roles: audience.roles }
    : audience.mode === "category" ? { categories: audience.categories }
    : {};

  const { data, error } = await adminClient
    .from("notification_broadcasts")
    .insert({
      sender_id:       senderId,
      audience:        audience.mode,
      audience_filter: filter,
      type:            content.type,
      title:           content.title,
      message:         content.message,
      action_url:      content.actionUrl ?? null,
      priority:        content.priority ?? DEFAULT_PRIORITY[content.type] ?? "normal",
      expires_at:      content.expiresAt ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[notifications] recordBroadcast failed:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function updateBroadcastCount(broadcastId: string, count: number): Promise<void> {
  const { error } = await adminClient
    .from("notification_broadcasts")
    .update({ recipient_count: count })
    .eq("id", broadcastId);
  if (error) console.error("[notifications] updateBroadcastCount failed:", error.message);
}
