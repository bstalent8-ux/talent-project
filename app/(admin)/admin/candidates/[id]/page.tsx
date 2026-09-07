export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { fetchCandidateById } from "@/features/candidates/services/candidates.service";
import { fetchStages } from "@/features/candidates/services/candidate-stages.service";
import { fetchCategories } from "@/features/candidates/services/candidate-taxonomy.service";
import CandidateDetailView from "./_components/CandidateDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CandidateDetailPage({ params }: Props) {
  const { id } = await params;
  const [candidate, stages, categories] = await Promise.all([
    fetchCandidateById(id),
    fetchStages(),
    fetchCategories(),
  ]);
  if (!candidate) notFound();

  return (
    <AdminShell title={candidate.fullName ?? "Candidate"}>
      <CandidateDetailView candidate={candidate} stages={stages} categories={categories} />
    </AdminShell>
  );
}
