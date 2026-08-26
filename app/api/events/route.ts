export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logEvent, logTalentProfileView } from "@/lib/events/service";
import { privateNoStoreHeaders } from "@/lib/cache";

// Client-originated events only — page_view, talent_profile_view, search,
// signup, login, page_engagement. booking_brief_sent / job_application are
// logged directly from their own routes (see lib/events/events.ts), which
// already have richer server-side context than a client POST could carry.
const CLIENT_EVENTS = ["page_view", "talent_profile_view", "search", "signup", "login", "page_engagement", "click"] as const;
type ClientEvent = typeof CLIENT_EVENTS[number];

const TARGET_TYPES = ["talent_profile", "job", "booking"] as const;
type TargetType = typeof TARGET_TYPES[number];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Per-event target requirements — anything that doesn't match exactly is
// rejected, not silently ignored. Only talent_profile_view carries a target
// today.
const TARGET_RULES: Record<ClientEvent, { type: TargetType } | null> = {
  page_view:            null,
  search:                null,
  signup:                null,
  login:                 null,
  page_engagement:       null,
  click:                 null,
  talent_profile_view:   { type: "talent_profile" },
};

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown, maxLen: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > maxLen) return null;
  return t;
}

/**
 * Strict per-event metadata schemas. An unknown key rejects the WHOLE
 * request (400) rather than being silently dropped — silently dropping
 * would let a client believe an unreviewed field was recorded when it
 * wasn't, and dropping-not-rejecting is how "arbitrary JSON" creeps back in
 * one key at a time. Missing/undefined metadata is always valid (every key
 * below is optional).
 */
const METADATA_VALIDATORS: Record<ClientEvent, (raw: unknown) => Record<string, unknown> | null> = {
  page_view: (raw) => {
    if (raw === undefined) return {};
    if (!isPlainRecord(raw)) return null;
    for (const key of Object.keys(raw)) if (key !== "path" && key !== "referrer") return null;
    const out: Record<string, unknown> = {};
    if (raw.path !== undefined) {
      const path = str(raw.path, 300);
      if (path === null) return null;
      out.path = path;
    }
    if (raw.referrer !== undefined) {
      const referrer = str(raw.referrer, 300);
      if (referrer === null) return null;
      out.referrer = referrer;
    }
    return out;
  },
  talent_profile_view: (raw) => {
    if (raw === undefined) return {};
    if (!isPlainRecord(raw)) return null;
    for (const key of Object.keys(raw)) if (key !== "path") return null;
    const out: Record<string, unknown> = {};
    if (raw.path !== undefined) {
      const path = str(raw.path, 300);
      if (path === null) return null;
      out.path = path;
    }
    return out;
  },
  search: (raw) => {
    if (raw === undefined) return {};
    if (!isPlainRecord(raw)) return null;
    for (const key of Object.keys(raw)) if (key !== "query" && key !== "result_count") return null;
    const out: Record<string, unknown> = {};
    if (raw.query !== undefined) {
      const query = str(raw.query, 200);
      if (query === null) return null;
      out.query = query;
    }
    if (raw.result_count !== undefined) {
      const n = raw.result_count;
      if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 100_000) return null;
      out.result_count = n;
    }
    return out;
  },
  signup: (raw) => {
    if (raw === undefined) return {};
    if (!isPlainRecord(raw)) return null;
    for (const key of Object.keys(raw)) if (key !== "role") return null;
    const out: Record<string, unknown> = {};
    if (raw.role !== undefined) {
      if (raw.role !== "talent" && raw.role !== "brand") return null;
      out.role = raw.role;
    }
    return out;
  },
  login: (raw) => {
    if (raw === undefined) return {};
    if (!isPlainRecord(raw)) return null;
    for (const key of Object.keys(raw)) if (key !== "role") return null;
    const out: Record<string, unknown> = {};
    if (raw.role !== undefined) {
      if (raw.role !== "talent" && raw.role !== "brand" && raw.role !== "admin") return null;
      out.role = raw.role;
    }
    return out;
  },
  // duration_ms: time the page stayed the visible tab. render_ms: a cheap
  // double-rAF estimate of mount-to-painted, not a Core Web Vitals metric —
  // null when the page was hidden before that frame ever ran. Caps are
  // sanity bounds against a tampered/garbage client value, not real limits.
  page_engagement: (raw) => {
    if (raw === undefined) return {};
    if (!isPlainRecord(raw)) return null;
    for (const key of Object.keys(raw)) {
      if (key !== "path" && key !== "duration_ms" && key !== "render_ms" && key !== "scrolled") return null;
    }
    const out: Record<string, unknown> = {};
    if (raw.path !== undefined) {
      const path = str(raw.path, 300);
      if (path === null) return null;
      out.path = path;
    }
    if (raw.duration_ms !== undefined) {
      const n = raw.duration_ms;
      if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 86_400_000) return null;
      out.duration_ms = n;
    }
    if (raw.render_ms !== undefined) {
      const n = raw.render_ms;
      if (n !== null && (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 60_000)) return null;
      out.render_ms = n;
    }
    if (raw.scrolled !== undefined) {
      if (typeof raw.scrolled !== "boolean") return null;
      out.scrolled = raw.scrolled;
    }
    return out;
  },
  // label: best-effort description of what was clicked (see
  // lib/analytics/click-tracking.ts). href: the link destination, only
  // present when the clicked element was an <a>.
  click: (raw) => {
    if (raw === undefined) return {};
    if (!isPlainRecord(raw)) return null;
    for (const key of Object.keys(raw)) {
      if (key !== "path" && key !== "label" && key !== "href") return null;
    }
    const out: Record<string, unknown> = {};
    if (raw.path !== undefined) {
      const path = str(raw.path, 300);
      if (path === null) return null;
      out.path = path;
    }
    if (raw.label !== undefined) {
      const label = str(raw.label, 150);
      if (label === null) return null;
      out.label = label;
    }
    if (raw.href !== undefined) {
      const href = str(raw.href, 300);
      if (href === null) return null;
      out.href = href;
    }
    return out;
  },
};

const MAX_METADATA_BYTES = 500;

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400, headers: privateNoStoreHeaders() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!isPlainRecord(body)) return bad("invalid body");

  const eventNameRaw = body.event_name;
  if (typeof eventNameRaw !== "string" || !(CLIENT_EVENTS as readonly string[]).includes(eventNameRaw)) {
    return bad("invalid event_name");
  }
  const eventName = eventNameRaw as ClientEvent;

  // session_id must be a UUID — this is the client-generated id from
  // lib/analytics/track.ts's crypto.randomUUID(), never a client-chosen
  // free-form string.
  const sessionId = body.session_id;
  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) return bad("session_id must be a UUID");

  const rule = TARGET_RULES[eventName];
  let targetType: TargetType | null = null;
  let targetId: string | null = null;

  if (rule) {
    if (body.target_type !== rule.type) return bad("invalid target_type for this event");
    if (typeof body.target_id !== "string" || !UUID_RE.test(body.target_id)) return bad("target_id must be a UUID");
    targetType = rule.type;
    targetId = body.target_id;
  } else if (body.target_type !== undefined || body.target_id !== undefined) {
    return bad(`${eventName} does not accept a target`);
  }

  const metadata = METADATA_VALIDATORS[eventName](body.metadata);
  if (metadata === null) return bad("invalid metadata");
  if (JSON.stringify(metadata).length > MAX_METADATA_BYTES) return bad("metadata too large");

  // Identity comes ONLY from the revalidated session — a client-supplied
  // user_id in the body (if any) is never read anywhere in this route.
  // getUser() (not getSession()) re-checks the JWT against Supabase, per
  // CLAUDE.md §5. Guests are allowed through with userId: null.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const ok = eventName === "talent_profile_view"
    ? await logTalentProfileView({ sessionId, userId, talentUserId: targetId as string, metadata })
    : await logEvent({ eventName, userId, sessionId, metadata });

  // A DB failure must not be reported back as a persisted success — the
  // browser's tracker still fire-and-forgets this response either way
  // (lib/analytics/track.ts), so a non-200 here never breaks navigation.
  if (!ok) return NextResponse.json({ error: "failed to record event" }, { status: 500, headers: privateNoStoreHeaders() });

  return NextResponse.json({ success: true }, { headers: privateNoStoreHeaders() });
}
