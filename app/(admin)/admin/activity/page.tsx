export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/auth/require-admin";
import { getAdminPermissions, permissionFor } from "@/lib/auth/permissions";
import { fetchActivity } from "@/features/activity/service";
import type { ActivityModule } from "@/features/activity/types";
import ActivityView from "./_components/ActivityView";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminActivityPage({ searchParams }: Props) {
  const admin = await getAdminUser();
  if (!admin) redirect("/login");

  const permissions = await getAdminPermissions(admin.id);
  const modules: ActivityModule[] = [];
  if (permissionFor(permissions, "leads").canRead) modules.push("lead");
  if (permissionFor(permissions, "candidates").canRead) modules.push("candidate");

  const sp = await searchParams;
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayIso();
  const personId = typeof sp.personId === "string" ? sp.personId : undefined;

  const initial = modules.length > 0
    ? await fetchActivity({ date, personId, modules })
    : { done: [], due: [], modules: [] as ActivityModule[] };

  return (
    <AdminShell title="Activity">
      <ActivityView initial={initial} date={date} personId={personId} />
    </AdminShell>
  );
}
