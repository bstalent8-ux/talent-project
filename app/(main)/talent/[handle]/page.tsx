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
import { ProfileError, profileService } from "@/features/profiles";
import type { PublicProfileDTO } from "@/features/profiles/types/dto";
import TalentProfileShell from "./_components/TalentProfileShell";

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

  if (!profile) notFound();

  // A brand handle must not render through the talent shell.
  if (profile.meta.typeSlug !== "talent") notFound();

  return <TalentProfileShell profile={profile} />;
}
