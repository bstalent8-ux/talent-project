export const runtime = "edge";
export const dynamic = "force-dynamic";

// /admin/profile-config/types/[id]/layout
//
// Note: `layout` here is a ROUTE SEGMENT, not a Next.js layout.tsx. No conflict,
// but it reads oddly next to real layout files — flagged in the approved plan.
//
// Admin role enforced by app/(admin)/layout.tsx.

import { notFound } from "next/navigation";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import LayoutEditorClient from "./_components/LayoutEditorClient";

export default async function ProfileTypeLayoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let type;
  try {
    type = await profileConfigService.getType(id);
  } catch {
    notFound();
  }

  // Sections come back including disabled ones; the editor filters to enabled,
  // because the API rejects a layout referencing a disabled section.
  const [sections, layouts] = await Promise.all([
    profileConfigService.listSections(id),
    profileConfigService.listLayouts(id),
  ]);

  return <LayoutEditorClient initialLayouts={layouts} profileType={type} sections={sections} />;
}
