// ─── Shared talent-profile loader ─────────────────────────────────────────────
// Used by all three public talent routes — /talent/[handle] (generic
// categories), /model/[handle], /ugc/[handle] — so the public gate, the
// owner-preview fallback, and the cache tag are defined exactly once. A
// forgotten filter here is a data leak (CLAUDE.md §8); do not duplicate this
// logic into a route folder again.

import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import { ProfileError, profileService } from "@/features/profiles";
import type { PublicProfileDTO, TalentPublicCore } from "@/features/profiles/types/dto";
import type { ModerationStatus } from "@/features/profiles/types/raw";

export { canonicalTalentPath } from "@/lib/talent-profile-route";

export interface LoadedTalentProfile {
  profile: PublicProfileDTO;
  /** True when this is the signed-in owner's own read-only preview of a
   * not-yet-approved listing — never a real public view. */
  isOwnerPreview: boolean;
  moderationStatus: ModerationStatus | null;
}

/**
 * The public gate hid this handle. Before returning nothing, check whether
 * the CURRENT signed-in visitor is the handle's own owner — if so, they get
 * the full read-only preview of their own not-yet-approved listing.
 *
 * Never runs the ungated preview lookup for anyone but a session whose own
 * handle matches the route param, so it cannot be used to probe another
 * profile's moderation status or content. Every other visitor (no session,
 * or a session that owns a different handle) still gets null — this NEVER
 * makes a pending profile public.
 */
async function getOwnerPreviewIfMatches(
  handle: string,
): Promise<{ profile: PublicProfileDTO; moderationStatus: ModerationStatus | null } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { profile, moderationStatus } = await profileService.getOwnerPreviewProfile(user.id);
    if (profile.meta.typeSlug !== "talent") return null;
    if ((profile.identity.handle ?? "").toLowerCase() !== handle.toLowerCase()) return null;

    return { profile, moderationStatus };
  } catch {
    return null;
  }
}

/** Fetches the public profile for `handle`, falling back to the owner's own
 * pending-listing preview. Returns null when neither applies (real 404). */
export async function loadTalentProfile(handle: string): Promise<LoadedTalentProfile | null> {
  const profile = await cachedPublic<PublicProfileDTO | null>(
    ["talent-detail", handle],
    [CACHE_TAGS.talents.detail(handle), CACHE_TAGS.talents.list],
    CACHE_SECONDS.tenMinutes,
    async () => {
      try {
        return await profileService.getPublicProfileByHandle(handle);
      } catch (e) {
        const error = ProfileError.from(e);
        // NOT_FOUND covers a missing handle, a blocked account and a talent
        // whose listing is not approved — deliberately the same outcome, so
        // the page cannot be used to probe moderation status. Anything else
        // is a real failure and must not be cached as a 404.
        if (error.status === 404) return null;
        throw error;
      }
    },
  );

  if (profile) {
    // A brand handle must not render through any talent shell.
    if (profile.meta.typeSlug !== "talent") return null;
    return { profile, isOwnerPreview: false, moderationStatus: null };
  }

  const owner = await getOwnerPreviewIfMatches(handle);
  if (owner) return { profile: owner.profile, isOwnerPreview: true, moderationStatus: owner.moderationStatus };

  return null;
}

export function talentCategory(profile: PublicProfileDTO): string | null {
  return (profile.core as TalentPublicCore).category;
}
