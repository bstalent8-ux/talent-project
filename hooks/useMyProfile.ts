"use client";

// ─── My-profile store (module singleton) ──────────────────────────────────
// The navbar avatar, the community page's profile card, and its composer
// bar all need the same viewer's own avatar/name. Each used to run its own
// `fetch("/api/me")` on mount — three requests for identical data, resolving
// at three different times, so the navbar avatar would pop in before the
// page content's copy of the same picture. Same fix as the notification
// store: one fetch per browser tab, every consumer reads the same snapshot
// through `useSyncExternalStore`, so they all update in the same tick.

import { useSyncExternalStore } from "react";

export interface MyProfileSnapshot {
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  role: string | null;
  is_verified?: boolean;
  talentProfile: {
    avg_rating: number | null;
    total_reviews: number | null;
    total_bookings: number | null;
    profile_views: number | null;
  } | null;
}

interface State {
  profile: MyProfileSnapshot | null;
  loading: boolean;
  initialized: boolean;
  userId: string | null;
}

const EMPTY: State = { profile: null, loading: true, initialized: false, userId: null };

let state: State = EMPTY;
const listeners = new Set<() => void>();

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getSnapshot(): State {
  return state;
}

/** SSR / first paint: a stable empty snapshot, no network. */
export function getServerSnapshot(): State {
  return EMPTY;
}

// ─── Auth wiring ────────────────────────────────────────────────────────────
// Same convention as hooks/notifications/store.ts: GuestGuard pushes its
// already-resolved user id here instead of this store resolving auth itself.
let authUserId: string | null = null;
let authKnown = false;
let loadPromise: Promise<void> | null = null;
let mountCount = 0;

/** Called by GuestGuard whenever its resolved user changes (including to/from null). */
export function setAuthUser(userId: string | null): void {
  if (authKnown && authUserId === userId) return;
  authKnown = true;
  authUserId = userId;

  if (!userId) {
    state = { ...EMPTY, loading: false, initialized: true };
    listeners.forEach((l) => l());
    return;
  }

  if (mountCount > 0) void loadForCurrentUser();
}

/**
 * Idempotent per user. Concurrent callers (multiple components mounting in
 * the same tick) share the same in-flight promise, so N mounts still produce
 * one request.
 */
function loadForCurrentUser(): Promise<void> {
  const userId = authUserId;
  if (!userId) return Promise.resolve();
  if (state.userId === userId && state.initialized) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) {
        setState({ loading: false, initialized: true, userId });
        return;
      }
      const data = await res.json();
      setState({
        profile: data.profile
          ? {
              full_name: data.profile.full_name,
              avatar_url: data.profile.avatar_url,
              city: data.profile.city,
              role: data.profile.role,
              is_verified: data.profile.is_verified,
              talentProfile: data.talentProfile ?? null,
            }
          : null,
        loading: false,
        initialized: true,
        userId,
      });
    } catch {
      setState({ loading: false, initialized: true, userId });
    }
  })().finally(() => {
    loadPromise = null;
  });

  return loadPromise;
}

/** Ref-counted subscribe used by every hook, mirroring the notification store. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  mountCount += 1;

  if (authKnown && authUserId) void loadForCurrentUser();

  return () => {
    listeners.delete(listener);
    mountCount -= 1;
    if (mountCount < 0) mountCount = 0;
  };
}

/** Test / logout hook — wipes everything. */
export function reset(): void {
  mountCount = 0;
  authKnown = false;
  authUserId = null;
  loadPromise = null;
  state = EMPTY;
  listeners.forEach((l) => l());
}

export interface UseMyProfileResult {
  profile: MyProfileSnapshot | null;
  loading: boolean;
}

/** The viewer's own profile — avatar, name, and (for talents) stats. */
export function useMyProfile(): UseMyProfileResult {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { profile: s.profile, loading: s.loading };
}
