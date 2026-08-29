// A profile's "Online" badge used to be driven by talent_profiles.availability
// ("available for new bookings", a manual toggle almost nobody ever flips
// off — every talent defaulted to it at signup) instead of anything about
// whether the person is actually on the site right now. Real presence data
// exists — profiles.last_active_at, throttled to a 5-minute write window by
// touch_last_active() (see supabase/migrations/20260823_user_events.sql) —
// this is the one place that turns it into an "online" boolean.

export const ONLINE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function isRecentlyActive(lastActiveAt: string | null, now: number = Date.now()): boolean {
  if (!lastActiveAt) return false;
  const ts = new Date(lastActiveAt).getTime();
  if (Number.isNaN(ts)) return false;
  return now - ts <= ONLINE_WINDOW_MS;
}
