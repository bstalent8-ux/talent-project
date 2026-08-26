// ─── Page-visit duration clustering ────────────────────────────────────────
// Pure logic, no DB — kept separate from admin.service.ts so it's unit-
// testable directly (this repo deliberately has no jsdom/RTL, but this
// needs none: it's plain array math).
//
// page_engagement rows are heartbeats: each one carries the RUNNING TOTAL
// duration_ms since the page mounted (see lib/analytics/page-engagement.ts),
// not a delta. Several rows exist per single page view. There's no explicit
// visit id linking them — the only signal is "same path, close together in
// time" — so this reconstructs visits by clustering consecutive same-path
// heartbeats and keeping the MAX duration_ms seen in each cluster (the last
// heartbeat before the visitor left, not a sum — summing would multiply one
// visit's time by however many heartbeats it happened to send).

export interface EngagementSample {
  path:        string;
  duration_ms: number;
  created_at:  string;
}

export interface PageVisit {
  path:       string;
  durationMs: number;
  startedAt:  string;
  endedAt:    string;
}

// A gap wider than this between two same-path heartbeats means the visitor
// left and came back later — a new visit, not a continuation of the old
// one. 3x the client's heartbeat interval (see HEARTBEAT_MS in
// lib/analytics/page-engagement.ts) comfortably covers one missed tick
// without merging two genuinely separate visits.
const DEFAULT_GAP_MS = 60_000;

export function clusterPageVisits(samples: EngagementSample[], gapMs: number = DEFAULT_GAP_MS): PageVisit[] {
  const sorted = [...samples].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const visits: PageVisit[] = [];
  let current: PageVisit | null = null;
  let currentTime = 0;

  for (const s of sorted) {
    const t = new Date(s.created_at).getTime();

    if (current && current.path === s.path && t - currentTime <= gapMs) {
      if (s.duration_ms > current.durationMs) current.durationMs = s.duration_ms;
      current.endedAt = s.created_at;
      currentTime = t;
      continue;
    }

    if (current) visits.push(current);
    current = { path: s.path, durationMs: s.duration_ms, startedAt: s.created_at, endedAt: s.created_at };
    currentTime = t;
  }
  if (current) visits.push(current);

  return visits;
}

export interface PageTotal {
  path:        string;
  totalMs:     number;
  visitCount:  number;
}

/** Aggregates clustered visits into "total time on this page across every
 * visit" — what an admin actually wants to read at a glance. */
export function totalDurationByPage(visits: PageVisit[]): PageTotal[] {
  const byPath = new Map<string, PageTotal>();
  for (const v of visits) {
    const existing = byPath.get(v.path);
    if (existing) {
      existing.totalMs += v.durationMs;
      existing.visitCount += 1;
    } else {
      byPath.set(v.path, { path: v.path, totalMs: v.durationMs, visitCount: 1 });
    }
  }
  return [...byPath.values()].sort((a, b) => b.totalMs - a.totalMs);
}
