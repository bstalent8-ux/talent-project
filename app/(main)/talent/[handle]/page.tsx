export const runtime = 'edge';

// ─── Public talent profile (generic categories) ───────────────────────────────
// model/fashion and ugc categories now live at /model/[handle] and
// /ugc/[handle] — this route redirects to those for any handle in one of
// those categories (covers old bookmarked/indexed /talent/ links) and
// renders the layout-driven shell for every other category, unchanged.

import { notFound, redirect } from "next/navigation";
import { loadTalentProfile, talentCategory, canonicalTalentPath } from "../../_lib/load-talent-profile";
import TalentProfileShell from "./_components/TalentProfileShell";
import PendingPreviewBanner from "./_components/PendingPreviewBanner";

export default async function TalentPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const loaded = await loadTalentProfile(handle);
  if (!loaded) notFound();

  const category = talentCategory(loaded.profile);
  if (category === "model" || category === "fashion" || category === "ugc") {
    redirect(canonicalTalentPath(category, handle));
  }

  return (
    <>
      {loaded.isOwnerPreview && <PendingPreviewBanner status={loaded.moderationStatus} />}
      <TalentProfileShell profile={loaded.profile} />
    </>
  );
}
