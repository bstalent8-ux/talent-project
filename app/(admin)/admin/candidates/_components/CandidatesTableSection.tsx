import { fetchCandidatesPage } from "@/features/candidates/services/candidates.service";
import CandidatesTable from "./CandidatesTable";

interface Props {
  page: number;
  pageSize: number;
  stage: string;
  category?: string;
  assignedTo?: string;
  actionDate?: string;
  actionPersonId?: string;
}

// Async Server Component — the only part of the page that suspends.
export default async function CandidatesTableSection({ page, pageSize, stage, category, assignedTo, actionDate, actionPersonId }: Props) {
  const { candidates, total } = await fetchCandidatesPage({ page, pageSize, stage, category, assignedTo, actionDate, actionPersonId });
  return <CandidatesTable candidates={candidates} total={total} page={page} pageSize={pageSize} stage={stage} category={category} assignedTo={assignedTo} actionDate={actionDate} actionPersonId={actionPersonId} />;
}
