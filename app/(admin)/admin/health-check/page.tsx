export const runtime = 'edge';

export const dynamic = "force-dynamic";

import AdminHealthCheckShell from "./_components/AdminHealthCheckShell";
import HealthCheckView from "./_components/HealthCheckView";
import { fetchLatestHealthCheck, fetchHealthCheckHistory } from "@/features/health-check/service";

// No live probes run on page load — only cheap reads of the last saved run
// + a short history, so no Suspense/skeleton split is needed here. The
// actual checkup (Cloudinary/Anthropic calls, self-probes) only runs when
// an admin clicks "Run Checkup" (see _components/HealthCheckView.tsx →
// POST /api/admin/health-check/run).
export default async function AdminHealthCheckPage() {
  const [latest, history] = await Promise.all([
    fetchLatestHealthCheck(),
    fetchHealthCheckHistory(),
  ]);

  return (
    <AdminHealthCheckShell>
      <HealthCheckView initialResult={latest} initialHistory={history} />
    </AdminHealthCheckShell>
  );
}
