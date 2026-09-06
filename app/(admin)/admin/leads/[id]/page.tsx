export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { fetchLeadById } from "@/features/leads/services/leads.service";
import LeadDetailView from "./_components/LeadDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const lead = await fetchLeadById(id);
  if (!lead) notFound();

  return (
    <AdminShell title={lead.fullName ?? "Lead"}>
      <LeadDetailView lead={lead} />
    </AdminShell>
  );
}
