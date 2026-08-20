export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { fetchAdminSupportTickets } from "@/features/admin/services/admin.service";
import AdminSupportClient from "./_components/AdminSupportClient";

export default async function AdminSupportPage() {
  const tickets = await fetchAdminSupportTickets();
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  return <AdminSupportClient tickets={tickets} emailConfigured={emailConfigured} />;
}
