"use client";

// ─── The one canonical Favorite-toggle implementation ──────────────────────
// Every surface that shows a Favorite heart on a talent (UGC profile, Model
// profile, the legacy TalentProfileShell's ProfileHero, Explore cards) reads
// and writes through this hook, which itself only talks to the one shared
// endpoint: GET/PUT/DELETE /api/favorites/[talentUserId]. There is no
// second favorites implementation and no localStorage fallback — state is
// always re-derived from Supabase on mount, so a refresh can never show a
// stale heart.

import { useCallback, useEffect, useState } from "react";
import { useGuestGuard } from "@/contexts/GuestGuard";

export function useFavoriteTalent(talentId: string) {
  const guard = useGuestGuard();
  const [isFavorited, setIsFavorited] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (guard.loading || guard.isGuest) { setIsFavorited(false); return; }
    let cancelled = false;
    fetch(`/api/favorites/${talentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data) setIsFavorited(Boolean(data.favorited)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [guard.loading, guard.isGuest, talentId]);

  const toggle = useCallback(async () => {
    if (guard.isGuest || pending) return;
    setPending(true);
    setError(false);
    const next = !isFavorited;
    setIsFavorited(next); // optimistic — reverted below on failure, never left active on a failed write
    try {
      const res = await fetch(`/api/favorites/${talentId}`, { method: next ? "PUT" : "DELETE" });
      if (!res.ok) {
        setIsFavorited(!next);
        setError(true);
        console.error("[favorites] toggle failed", { talentId, status: res.status });
      }
    } catch (e) {
      setIsFavorited(!next);
      setError(true);
      console.error("[favorites] toggle network error", { talentId, error: e });
    } finally {
      setPending(false);
    }
  }, [guard.isGuest, isFavorited, pending, talentId]);

  return { isFavorited, pending, error, toggle, isGuest: guard.isGuest };
}
