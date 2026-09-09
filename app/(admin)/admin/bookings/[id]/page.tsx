export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { fetchAdminBookingDetail } from "@/features/admin/services/admin.service";
import AdminBookingDetailClient from "./_components/AdminBookingDetailClient";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await fetchAdminBookingDetail(id);
  if (!booking) notFound();

  return <AdminBookingDetailClient booking={booking} />;
}
