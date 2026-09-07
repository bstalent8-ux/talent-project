export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { fetchLeadById } from "@/features/leads/services/leads.service";
import { fetchStages } from "@/features/leads/services/lead-stages.service";
import { fetchTerms } from "@/features/leads/services/lead-taxonomy.service";
import LeadDetailView from "./_components/LeadDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const [lead, stages, channels, categories] = await Promise.all([
    fetchLeadById(id),
    fetchStages(),
    fetchTerms("lead_channels"),
    fetchTerms("lead_categories"),
  ]);
  if (!lead) notFound();

  return (
    <AdminShell title={lead.fullName ?? "Lead"}>
      <LeadDetailView lead={lead} stages={stages} channels={channels} categories={categories} />
    </AdminShell>
  );
}
