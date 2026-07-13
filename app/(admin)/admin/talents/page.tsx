export const dynamic = "force-dynamic";

import { fetchAdminTalents } from "@/features/admin/services/admin.service";
import TalentsTableClient from "./_components/TalentsTableClient";

export default async function AdminTalentsPage() {
  const talents = await fetchAdminTalents();
  return <TalentsTableClient talents={talents} />;
}
