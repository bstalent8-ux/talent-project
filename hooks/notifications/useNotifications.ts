"use client";

// ─── Public notification hooks ───────────────────────────────────────────────
// All three read the same singleton store, so mounting all three costs one
// fetch and one Realtime channel — not three of each.

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Notification } from "@/lib/notifications/types";
import {
  getServerSnapshot,
  getSnapshot,
  loadMore as storeLoadMore,
  markAllAsRead as storeMarkAllAsRead,
  markAsRead as storeMarkAsRead,
  refresh as storeRefresh,
  remove as storeRemove,
  subscribe,
} from "./store";

function useNotificationState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount:   number;
  total:         number;
  hasMore:       boolean;
  loading:       boolean;
  loadingMore:   boolean;
  error:         string | null;
  markAsRead:    (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  loadMore:      () => Promise<void>;
  refresh:       () => Promise<void>;
}

/** Full feed + actions. Newest first, paginated 20 at a time. */
export function useNotifications(): UseNotificationsResult {
  const state = useNotificationState();

  const markAsRead    = useCallback((id: string) => storeMarkAsRead(id), []);
  const markAllAsRead = useCallback(() => storeMarkAllAsRead(), []);
  const deleteOne     = useCallback((id: string) => storeRemove(id), []);
  const loadMore      = useCallback(() => storeLoadMore(), []);
  const refresh       = useCallback(() => storeRefresh(), []);

  return {
    notifications: state.notifications,
    unreadCount:   state.unreadCount,
    total:         state.total,
    hasMore:       state.hasMore,
    loading:       state.loading,
    loadingMore:   state.loadingMore,
    error:         state.error,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteOne,
    loadMore,
    refresh,
  };
}

/** Only the unread ones, from the pages already loaded. */
export function useUnreadNotifications(): {
  notifications: Notification[];
  unreadCount:   number;
  loading:       boolean;
  markAsRead:    (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
} {
  const state = useNotificationState();

  const unread = useMemo(
    () => state.notifications.filter((n) => !n.is_read),
    [state.notifications]
  );

  const markAsRead    = useCallback((id: string) => storeMarkAsRead(id), []);
  const markAllAsRead = useCallback(() => storeMarkAllAsRead(), []);

  return {
    notifications: unread,
    unreadCount:   state.unreadCount,
    loading:       state.loading,
    markAsRead,
    markAllAsRead,
  };
}

/**
 * Badge-only consumer. Returns a primitive, so a component using just this
 * re-renders only when the number actually changes — not on every list edit.
 */
export function useUnreadCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot().unreadCount,
    () => 0
  );
}
