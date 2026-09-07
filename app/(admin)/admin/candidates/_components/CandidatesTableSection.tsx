import { fetchCandidatesPage } from "@/features/candidates/services/candidates.service";
import CandidatesTable from "./CandidatesTable";

interface Props {
  page: number;
  pageSize: number;
  stage: string;
  category?: string;
  assignedTo?: string;
}

// Async Server Component — the only part of the page that suspends.
export default async function CandidatesTableSection({ page, pageSize, stage, category, assignedTo }: Props) {
  const { candidates, total } = await fetchCandidatesPage({ page, pageSize, stage, category, assignedTo });
  return <CandidatesTable candidates={candidates} total={total} page={page} pageSize={pageSize} stage={stage} category={category} assignedTo={assignedTo} />;
}
