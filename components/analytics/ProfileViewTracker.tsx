"use client";

// Mounted once by each profile shell (TalentProfileShell, ModelProfileShell,
// UgcProfileShell). `profileUserId` is PublicProfileDTO.identity.id —
// profiles.id, the only id the browser ever receives for a talent (see
// features/profiles/types/dto.ts's SharedIdentityDTO). The server route
// resolves it to the matching talent_profiles row itself (see
// track_talent_profile_view() in supabase/migrations/20260823_user_events.sql)
// — this component never needs to know talent_profiles.id.
//
// Fires once per mount, not per render — a profile page doesn't remount on
// tab/section navigation within DynamicProfileRenderer. Repeated mounts
// (refresh, revisit) are still safe: track_talent_profile_view() dedupes by
// (session_id, talent) over a 30-minute window at the DB layer, so this
// component doesn't need — and must not add — its own client-side dedupe.

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { trackMetaEvent } from "@/lib/analytics/meta-pixel";

export default function ProfileViewTracker({ profileUserId }: { profileUserId: string }) {
  useEffect(() => {
    trackEvent("talent_profile_view", { targetType: "talent_profile", targetId: profileUserId });
    trackMetaEvent("ViewContent", { content_type: "talent_profile", content_ids: [profileUserId] });
  }, [profileUserId]);

  return null;
}
