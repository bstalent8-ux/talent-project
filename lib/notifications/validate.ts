// ─── Hand-rolled request validation ──────────────────────────────────────────
// `zod` is installed but unused across this codebase (CLAUDE.md §2); validation
// stays hand-written so this feature doesn't become the one exception.

import {
  isNotificationPriority,
  isNotificationType,
  type NotificationAudience,
  type NotificationPriority,
  type NotificationType,
} from "./types";

export type ValidationResult<T> =
  | { ok: true;  value: T }
  | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

function uuidList(value: unknown, field: string, max = 5000): ValidationResult<string[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: `${field} must be a non-empty array` };
  }
  if (value.length > max) {
    return { ok: false, error: `${field} may contain at most ${max} entries` };
  }
  const unique = Array.from(new Set(value));
  if (!unique.every(isUuid)) return { ok: false, error: `${field} must contain valid uuids` };
  return { ok: true, value: unique };
}

/** Roles accepted by the admin composer. Mirrors the `user_role` enum. */
export const TARGETABLE_ROLES = ["talent", "brand", "admin"] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAudience(body: any): ValidationResult<NotificationAudience> {
  const mode = body?.audience;

  switch (mode) {
    case "single": {
      const id = body?.user_id ?? body?.userId;
      if (!isUuid(id)) return { ok: false, error: "user_id must be a valid uuid" };
      return { ok: true, value: { mode: "single", userId: id } };
    }
    case "multiple": {
      const parsed = uuidList(body?.user_ids ?? body?.userIds, "user_ids");
      if (parsed.ok === false) return { ok: false, error: parsed.error };
      return { ok: true, value: { mode: "multiple", userIds: parsed.value } };
    }
    case "role": {
      const roles = body?.roles;
      if (!Array.isArray(roles) || roles.length === 0) {
        return { ok: false, error: "roles must be a non-empty array" };
      }
      const invalid = roles.filter((r: unknown) => !(TARGETABLE_ROLES as readonly string[]).includes(r as string));
      if (invalid.length) return { ok: false, error: `unsupported role: ${invalid.join(", ")}` };
      return { ok: true, value: { mode: "role", roles: Array.from(new Set(roles)) as string[] } };
    }
    case "category": {
      const categories = body?.categories;
      if (!Array.isArray(categories) || categories.length === 0) {
        return { ok: false, error: "categories must be a non-empty array" };
      }
      if (!categories.every((c: unknown) => typeof c === "string" && c.length > 0 && c.length <= 64)) {
        return { ok: false, error: "categories must be non-empty strings" };
      }
      return { ok: true, value: { mode: "category", categories: Array.from(new Set(categories)) as string[] } };
    }
    case "everyone":
      return { ok: true, value: { mode: "everyone" } };
    default:
      return { ok: false, error: "audience must be one of: single, multiple, role, category, everyone" };
  }
}

export interface AnnouncementBody {
  title:      string;
  message:    string;
  titleEn:    string | null;
  messageEn:  string | null;
  type:       NotificationType;
  priority:   NotificationPriority;
  actionUrl:  string | null;
  expiresAt:  string | null;
}

const MAX_TITLE   = 160;
const MAX_MESSAGE = 1000;

/**
 * `action_url` must stay on-site. An open redirect in a notification that lands
 * in every user's bell is a phishing primitive, so absolute URLs are rejected.
 */
function parseActionUrl(value: unknown): ValidationResult<string | null> {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string")     return { ok: false, error: "action_url must be a string" };

  const url = value.trim();
  if (!url.startsWith("/") || url.startsWith("//")) {
    return { ok: false, error: "action_url must be a relative path starting with /" };
  }
  if (url.length > 512) return { ok: false, error: "action_url is too long" };
  return { ok: true, value: url };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAnnouncement(body: any): ValidationResult<AnnouncementBody> {
  const title   = typeof body?.title   === "string" ? body.title.trim()   : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!title)                  return { ok: false, error: "title is required" };
  if (title.length > MAX_TITLE) return { ok: false, error: `title must be ≤ ${MAX_TITLE} characters` };
  if (!message)                return { ok: false, error: "message is required" };
  if (message.length > MAX_MESSAGE) return { ok: false, error: `message must be ≤ ${MAX_MESSAGE} characters` };

  const rawType = body?.type ?? "ADMIN_MESSAGE";
  if (!isNotificationType(rawType)) return { ok: false, error: "unknown notification type" };

  const rawPriority = body?.priority ?? "normal";
  if (!isNotificationPriority(rawPriority)) return { ok: false, error: "unknown priority" };

  const actionUrl = parseActionUrl(body?.action_url ?? body?.actionUrl);
  if (actionUrl.ok === false) return { ok: false, error: actionUrl.error };

  let expiresAt: string | null = null;
  const rawExpires = body?.expires_at ?? body?.expiresAt;
  if (rawExpires) {
    const parsed = new Date(rawExpires);
    if (Number.isNaN(parsed.getTime())) return { ok: false, error: "expires_at is not a valid date" };
    if (parsed.getTime() <= Date.now()) return { ok: false, error: "expires_at must be in the future" };
    expiresAt = parsed.toISOString();
  }

  const titleEn   = typeof body?.title_en   === "string" ? body.title_en.trim()   : null;
  const messageEn = typeof body?.message_en === "string" ? body.message_en.trim() : null;

  if (titleEn && titleEn.length > MAX_TITLE)       return { ok: false, error: `title_en must be ≤ ${MAX_TITLE} characters` };
  if (messageEn && messageEn.length > MAX_MESSAGE) return { ok: false, error: `message_en must be ≤ ${MAX_MESSAGE} characters` };

  return {
    ok: true,
    value: {
      title,
      message,
      titleEn:   titleEn   || null,
      messageEn: messageEn || null,
      type:      rawType,
      priority:  rawPriority,
      actionUrl: actionUrl.value,
      expiresAt,
    },
  };
}
