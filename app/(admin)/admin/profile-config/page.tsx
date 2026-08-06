export const runtime = "edge";
export const dynamic = "force-dynamic";

// /admin/profile-config — profile types list + editor.
// Admin role is enforced by app/(admin)/layout.tsx; no per-page auth here,
// matching every other admin screen.

import { profileConfigService } from "@/features/profiles/services/profile-config.service";
import ProfileTypesClient from "./_components/ProfileTypesClient";

export default async function ProfileConfigPage() {
  const types = await profileConfigService.listTypes();
  return <ProfileTypesClient initialTypes={types} />;
}
