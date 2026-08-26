export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { fetchAdminVisitorDetail } from "@/features/admin/services/admin.service";
import VisitorDetailView from "./_components/VisitorDetailView";

interface Props {
  params: Promise<{ key: string }>;
}

export default async function AdminVisitorDetailPage({ params }: Props) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);

  const visitor = await fetchAdminVisitorDetail(key);
  if (!visitor) notFound();

  return <VisitorDetailView visitor={visitor} />;
}
