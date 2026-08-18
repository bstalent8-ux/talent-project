export const runtime = 'edge';

// ─── Public UGC talent profile ────────────────────────────────────────────────
// Canonical URL for category === "ugc" (see
// app/(main)/_lib/load-talent-profile.ts's canonicalTalentPath). A handle
// that isn't actually UGC redirects to its real canonical route — this page
// is never a second way to reach a non-UGC profile.

import { notFound, redirect } from "next/navigation";
import { loadTalentProfile, talentCategory, canonicalTalentPath } from "../../_lib/load-talent-profile";
import UgcProfileShell from "../../talent/[handle]/_components/ugc/UgcProfileShell";
import PendingPreviewBanner from "../../talent/[handle]/_components/PendingPreviewBanner";

export default async function UgcTalentPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const loaded = await loadTalentProfile(handle);
  if (!loaded) notFound();

  const category = talentCategory(loaded.profile);
  if (category !== "ugc") {
    redirect(canonicalTalentPath(category, handle));
  }

  return (
    <>
      {loaded.isOwnerPreview && <PendingPreviewBanner status={loaded.moderationStatus} />}
      <UgcProfileShell profile={loaded.profile} />
    </>
  );
}
