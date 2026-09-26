export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { fetchTalentGenderRows } from "@/features/admin/services/talent-gender.service";
import TalentGenderClient from "./_components/TalentGenderClient";

// Back-fill for the Explore Male/Female filter: one row per talent with two
// buttons, each click saves immediately (PATCH /api/admin/talents/gender).
export default async function AdminTalentGenderPage() {
  const rows = await fetchTalentGenderRows();
  return <TalentGenderClient rows={rows} />;
}
