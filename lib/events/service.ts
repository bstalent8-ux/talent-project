// ─── Event log service (SERVER ONLY) ─────────────────────────────────────────
// Every write goes through the service role — mirrors lib/notifications/
// service.ts. Nothing in this file reads the current user; callers pass ids
// explicitly.
//
// Never import this from a "use client" file.

import { adminClient } from "@/lib/supabase/admin";

export type EventName =
  | "page_view"
  | "talent_profile_view"
  | "search"
  | "booking_brief_sent"
  | "job_application"
  | "signup"
  | "login"
  | "page_engagement"
  | "click";

/**
 * profiles.last_active_at is throttled at the DB layer (touch_last_active(),
 * a single guarded UPDATE — see supabase/migrations/20260823_user_events.sql)
 * so a signed-in user's flurry of events costs at most one write per
 * 5-minute window, not one write per event.
 */
async function touchLastActive(userId: string): Promise<void> {
  const { error } = await adminClient.rpc("touch_last_active", { p_user_id: userId });
  if (error) console.error("[events] touch_last_active failed:", error.message);
}

export interface LogEventInput {
  eventName: Exclude<EventName, "talent_profile_view">;
  userId?:    string | null;
  sessionId:  string;
  targetType?: string | null;
  targetId?:   string | null;
  metadata?:   Record<string, unknown>;
}

/**
 * Insert one event row. Failures are logged and swallowed — an analytics
 * write must never break the business flow that triggered it — but the
 * caller still gets an honest boolean back (see app/api/events/route.ts:
 * a DB failure must not be reported to the client as a persisted success).
 *
 * talent_profile_view is deliberately NOT accepted here — it needs the
 * dedupe-aware path, see logTalentProfileView below.
 */
export async function logEvent(input: LogEventInput): Promise<boolean> {
  const { error } = await adminClient.from("user_events").insert({
    user_id:     input.userId ?? null,
    session_id:  input.sessionId,
    event_name:  input.eventName,
    target_type: input.targetType ?? null,
    target_id:   input.targetId ?? null,
    metadata:    input.metadata ?? {},
  });

  if (error) {
    console.error("[events] logEvent failed:", error.message);
    return false;
  }

  if (input.userId) await touchLastActive(input.userId);
  return true;
}

export interface LogTalentProfileViewInput {
  sessionId:     string;
  userId?:       string | null;
  talentUserId:  string;
  metadata?:     Record<string, unknown>;
}

/**
 * Dedupe-aware: counts at most once per (session_id, talent) per 30-minute
 * window, atomically, at the DB layer (track_talent_profile_view() in
 * supabase/migrations/20260823_user_events.sql). A refresh-spam loop from
 * the same session neither inflates talent_profiles.profile_views nor the
 * admin analytics table — the row-insert into user_events happens inside the
 * same DB function, gated by the same dedupe decision.
 */
export async function logTalentProfileView(input: LogTalentProfileViewInput): Promise<boolean> {
  const { error } = await adminClient.rpc("track_talent_profile_view", {
    p_session_id:     input.sessionId,
    p_viewer_user_id: input.userId ?? null,
    p_talent_user_id: input.talentUserId,
    p_metadata:       input.metadata ?? {},
  });

  if (error) {
    console.error("[events] track_talent_profile_view failed:", error.message);
    return false;
  }

  if (input.userId) await touchLastActive(input.userId);
  return true;
}
