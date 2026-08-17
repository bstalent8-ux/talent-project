export const runtime = 'edge';

// ─── Public talent profile ────────────────────────────────────────────────────
// Reads ONE DTO from ProfileService and hands it to the layout-driven shell.
//
// Replaces the previous fetch-four-things-and-transform composition. Three
// things change as a result, all of them the point of the exercise:
//
//   • the public gate lives in TalentProvider, not re-implemented here
//     (CLAUDE.md §8 — RLS is bypassed, so a forgotten filter is a data leak)
//   • empty sections never reach the client; the profile shrinks around them
//   • section order comes from profile_layouts, not from JSX
//
// The cachedPublic wrapper and its tags are UNCHANGED. Dropping them would make
// every profile view a fresh fan-out of provider queries, and the existing
// revalidateTag calls on profile edits would stop invalidating anything.

import { notFound } from "next/navigation";
import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import { ProfileError, profileService } from "@/features/profiles";
import type { PublicProfileDTO, TalentPublicCore } from "@/features/profiles/types/dto";
import type { ModerationStatus } from "@/features/profiles/types/raw";
import TalentProfileShell from "./_components/TalentProfileShell";
import UgcProfileShell from "./_components/ugc/UgcProfileShell";
import ModelProfileShell from "./_components/model/ModelProfileShell";
import PendingPreviewBanner from "./_components/PendingPreviewBanner";

/**
 * category === "ugc" renders UgcProfileShell. category === "model" or the
 * legacy "fashion" value (pre-dates the "model" category and describes the
 * same talent type) both render ModelProfileShell. Every other category
 * (legacy, null) is unaffected — TalentProfileShell is untouched. Stored
 * category values are not migrated — this is UI routing only.
 */
function renderTalentShell(profile: PublicProfileDTO) {
  const category = (profile.core as TalentPublicCore).category;
  if (category === "ugc") return <UgcProfileShell profile={profile} />;
  if (category === "model" || category === "fashion") return <ModelProfileShell profile={profile} />;
  return <TalentProfileShell profile={profile} />;
}

/**
 * The public gate hid this handle. Before returning a plain 404, check
 * whether the CURRENT signed-in visitor is the handle's own owner — if so,
 * they get the full read-only preview of their own not-yet-approved listing
 * instead of a bare "not found".
 *
 * Never runs the ungated preview lookup for anyone but a session whose own
 * handle matches the route param, so it cannot be used to probe another
 * profile's moderation status or content. Every other visitor (no session,
 * or a session that owns a different handle) still falls through to
 * notFound() exactly as before — this NEVER makes a pending profile public.
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
    // No session, no core row, blocked account, or the lookup failed — same
    // as "not the owner" from this function's point of view. The caller
    // still 404s.
    return null;
  }
}

export default async function TalentPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

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
        // whose listing is not approved — deliberately the same outcome, so the
        // page cannot be used to probe moderation status. Anything else is a
        // real failure and must not be cached as a 404.
        if (error.status === 404) return null;
        throw error;
      }
    },
  );

  if (!profile) {
    const owner = await getOwnerPreviewIfMatches(handle);
    if (owner) {
      return (
        <>
          <PendingPreviewBanner status={owner.moderationStatus} />
          {renderTalentShell(owner.profile)}
        </>
      );
    }
    notFound();
  }

  // A brand handle must not render through the talent shell.
  if (profile.meta.typeSlug !== "talent") notFound();

  return renderTalentShell(profile);
}
