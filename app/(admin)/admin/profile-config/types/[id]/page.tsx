export const runtime = "edge";
export const dynamic = "force-dynamic";

// /admin/profile-config/types/[id] — sections for one profile type.
// Admin role enforced by app/(admin)/layout.tsx.

import { notFound } from "next/navigation";
import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import ProfileSectionsClient from "./_components/ProfileSectionsClient";

export default async function ProfileTypeSectionsPage({
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

  const sections = await profileConfigService.listSections(id);

  return <ProfileSectionsClient profileType={type} initialSections={sections} />;
}
