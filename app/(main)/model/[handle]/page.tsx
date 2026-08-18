export const runtime = 'edge';

// ─── Public Model/Fashion talent profile ──────────────────────────────────────
// Canonical URL for category === "model" | "fashion" (see
// app/(main)/_lib/load-talent-profile.ts's canonicalTalentPath). A handle
// that isn't actually Model/Fashion redirects to its real canonical route —
// this page is never a second way to reach a non-Model profile.

import { notFound, redirect } from "next/navigation";
import { loadTalentProfile, talentCategory, canonicalTalentPath } from "../../_lib/load-talent-profile";
import ModelProfileShell from "../../talent/[handle]/_components/model/ModelProfileShell";
import PendingPreviewBanner from "../../talent/[handle]/_components/PendingPreviewBanner";

export default async function ModelTalentPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const loaded = await loadTalentProfile(handle);
  if (!loaded) notFound();

  const category = talentCategory(loaded.profile);
  if (category !== "model" && category !== "fashion") {
    redirect(canonicalTalentPath(category, handle));
  }

  return (
    <>
      {loaded.isOwnerPreview && <PendingPreviewBanner status={loaded.moderationStatus} />}
      <ModelProfileShell profile={loaded.profile} />
    </>
  );
}
