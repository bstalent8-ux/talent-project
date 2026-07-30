"use client";

// ─── Notification store (module singleton) ───────────────────────────────────
// The bell, the floating widget and the /notifications page are all mounted at
// once. If each owned its own fetch + Realtime channel we'd pay 3× the queries
// and 3× the WebSocket subscriptions, and the three unread badges would drift
// apart.
//
// So there is exactly ONE store per browser tab:
//   • one initial fetch, shared
//   • one Realtime channel, ref-counted — opened on the first mount, closed on
//     the last unmount
//   • every consumer reads the same snapshot through `useSyncExternalStore`
//
// Mutations are optimistic and roll back if the request fails.

import { createClient, getBrowserUser } from "@/lib/supabase/client";
import type { Notification } from "@/lib/notifications/types";

export interface NotificationState {
  notifications: Notification[];
  unreadCount:   number;
  total:         number;
  page:          number;
  pageSize:      number;
  hasMore:       boolean;
  loading:       boolean;
  loadingMore:   boolean;
  initialized:   boolean;
  userId:        string | null;
  error:         string | null;
}

const PAGE_SIZE = 20;

const EMPTY: NotificationState = {
  notifications: [],
  unreadCount:   0,
  total:         0,
  page:          1,
  pageSize:      PAGE_SIZE,
  hasMore:       false,
  loading:       true,
  loadingMore:   false,
  initialized:   false,
  userId:        null,
  error:         null,
};

let state: NotificationState = EMPTY;

const listeners = new Set<() => void>();

function setState(patch: Partial<NotificationState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getSnapshot(): NotificationState {
  return state;
}

/** SSR / first paint: a stable empty snapshot, no network. */
export function getServerSnapshot(): NotificationState {
  return EMPTY;
}

// ─── Fetching ────────────────────────────────────────────────────────────────

let initPromise: Promise<void> | null = null;

async function fetchPage(page: number): Promise<{
  notifications: Notification[];
  total:   number;
  hasMore: boolean;
  unreadCount: number;
} | null> {
  const res = await fetch(`/api/notifications?page=${page}&pageSize=${PAGE_SIZE}`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Idempotent. Concurrent callers share the same in-flight promise, so N
 * components mounting in the same tick still produce one request.
 */
export function init(): Promise<void> {
  if (state.initialized) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { data: { user } } = await getBrowserUser();

    if (!user) {
      setState({ ...EMPTY, loading: false, initialized: true });
      return;
    }

    const result = await fetchPage(1);
    if (!result) {
      setState({ loading: false, initialized: true, userId: user.id, error: "failed to load notifications" });
      return;
    }

    setState({
      notifications: result.notifications,
      total:         result.total,
      hasMore:       result.hasMore,
      unreadCount:   result.unreadCount,
      page:          1,
      loading:       false,
      initialized:   true,
      userId:        user.id,
      error:         null,
    });

    openChannel(user.id);
  })().finally(() => { initPromise = null; });

  return initPromise;
}

/** Re-fetch page 1 without clearing the list (used after a realtime gap). */
export async function refresh(): Promise<void> {
  if (!state.userId) return;
  const result = await fetchPage(1);
  if (!result) return;
  setState({
    notifications: result.notifications,
    total:         result.total,
    hasMore:       result.hasMore,
    unreadCount:   result.unreadCount,
    page:          1,
  });
}

export async function loadMore(): Promise<void> {
  if (!state.hasMore || state.loadingMore || !state.userId) return;

  setState({ loadingMore: true });
  const next   = state.page + 1;
  const result = await fetchPage(next);

  if (!result) {
    setState({ loadingMore: false });
    return;
  }

  // De-dupe against realtime inserts that already landed at the head.
  const seen   = new Set(state.notifications.map((n) => n.id));
  const merged = [...state.notifications, ...result.notifications.filter((n) => !seen.has(n.id))];

  setState({
    notifications: merged,
    page:          next,
    total:         result.total,
    hasMore:       result.hasMore,
    unreadCount:   result.unreadCount,
    loadingMore:   false,
  });
}

// ─── Mutations (optimistic) ──────────────────────────────────────────────────

export async function markAsRead(id: string): Promise<void> {
  const before = state.notifications;
  const target = before.find((n) => n.id === id);
  if (!target || target.is_read) return;

  const beforeCount = state.unreadCount;
  setState({
    notifications: before.map((n) =>
      n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
    ),
    unreadCount: Math.max(0, beforeCount - 1),
  });

  const res = await fetch(`/api/notifications/${id}`, {
    method:      "PATCH",
    headers:     { "Content-Type": "application/json" },
    credentials: "include",
    body:        JSON.stringify({ is_read: true }),
  }).catch(() => null);

  if (!res?.ok) setState({ notifications: before, unreadCount: beforeCount });
}

export async function markAllAsRead(): Promise<void> {
  const before      = state.notifications;
  const beforeCount = state.unreadCount;
  if (beforeCount === 0) return;

  const now = new Date().toISOString();
  setState({
    notifications: before.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: now })),
    unreadCount:   0,
  });

  const res = await fetch("/api/notifications/read-all", {
    method:      "POST",
    credentials: "include",
  }).catch(() => null);

  if (!res?.ok) setState({ notifications: before, unreadCount: beforeCount });
}

export async function remove(id: string): Promise<void> {
  const before      = state.notifications;
  const beforeCount = state.unreadCount;
  const beforeTotal = state.total;
  const target      = before.find((n) => n.id === id);
  if (!target) return;

  setState({
    notifications: before.filter((n) => n.id !== id),
    unreadCount:   target.is_read ? beforeCount : Math.max(0, beforeCount - 1),
    total:         Math.max(0, beforeTotal - 1),
  });

  const res = await fetch(`/api/notifications/${id}`, {
    method:      "DELETE",
    credentials: "include",
  }).catch(() => null);

  if (!res?.ok) setState({ notifications: before, unreadCount: beforeCount, total: beforeTotal });
}

// ─── Realtime ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;
let mountCount = 0;

function isVisible(n: Notification): boolean {
  return !n.expires_at || new Date(n.expires_at).getTime() > Date.now();
}

function openChannel(userId: string) {
  if (channel) return;

  const supabase = createClient();

  channel = supabase
    .channel(`notifications:${userId}`)
    // INSERT — a new notification arrived
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        const n = payload.new as Notification;
        if (!isVisible(n)) return;
        if (state.notifications.some((x) => x.id === n.id)) return;

        setState({
          notifications: [n, ...state.notifications],
          total:         state.total + 1,
          unreadCount:   n.is_read ? state.unreadCount : state.unreadCount + 1,
        });
      }
    )
    // UPDATE — read elsewhere, or a collapsed chat notification was refreshed
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "UPDATE", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        const n   = payload.new as Notification;
        const old = payload.old as Notification | undefined;
        const known = state.notifications.some((x) => x.id === n.id);

        if (!known) {
          // A collapsed chat notification we hadn't loaded yet — pull it in.
          if (isVisible(n)) {
            setState({
              notifications: [n, ...state.notifications],
              unreadCount:   n.is_read ? state.unreadCount : state.unreadCount + 1,
            });
          }
          return;
        }

        let delta = 0;
        if (old && old.is_read !== n.is_read) delta = n.is_read ? -1 : 1;

        setState({
          notifications: state.notifications.map((x) => (x.id === n.id ? n : x)),
          unreadCount:   Math.max(0, state.unreadCount + delta),
        });
      }
    )
    // DELETE — dismissed on another device
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "postgres_changes" as any,
      { event: "DELETE", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        const id = (payload.old as Notification | undefined)?.id;
        if (!id) return;
        const target = state.notifications.find((x) => x.id === id);
        if (!target) return;

        setState({
          notifications: state.notifications.filter((x) => x.id !== id),
          total:         Math.max(0, state.total - 1),
          unreadCount:   target.is_read ? state.unreadCount : Math.max(0, state.unreadCount - 1),
        });
      }
    )
    .subscribe();
}

function closeChannel() {
  if (!channel) return;
  createClient().removeChannel(channel);
  channel = null;
}

/**
 * Ref-counted subscribe used by every hook. The channel opens once and only
 * closes when the last consumer unmounts.
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  mountCount += 1;

  void init();

  return () => {
    listeners.delete(listener);
    mountCount -= 1;
    if (mountCount <= 0) {
      mountCount = 0;
      closeChannel();
      // Keep `state` so a remount paints instantly from cache; `initialized`
      // stays true and the realtime channel reopens on the next init().
      state = { ...state, initialized: false };
    }
  };
}

/** Test / logout hook — wipes everything. */
export function reset() {
  closeChannel();
  mountCount = 0;
  state = EMPTY;
  listeners.forEach((l) => l());
}
