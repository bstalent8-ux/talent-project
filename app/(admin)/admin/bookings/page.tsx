export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { fetchAdminBookings } from "@/features/admin/services/admin.service";
import AdminBookingsClient from "./_components/AdminBookingsClient";

export default async function AdminBookingsPage() {
  const bookings = await fetchAdminBookings();
  return <AdminBookingsClient bookings={bookings} />;
}