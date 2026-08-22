export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { fetchAdminTalentTypeRequests } from "@/features/admin/services/admin.service";
import AdminTalentDemandClient from "./_components/AdminTalentDemandClient";

export default async function AdminTalentDemandPage() {
  const requests = await fetchAdminTalentTypeRequests();
  return <AdminTalentDemandClient requests={requests} />;
}
