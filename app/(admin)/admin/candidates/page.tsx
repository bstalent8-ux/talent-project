export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminCandidatesShell from "./_components/AdminCandidatesShell";
import CandidateImportPanel from "./_components/CandidateImportPanel";
import CandidatesTableSection from "./_components/CandidatesTableSection";
import CandidatesTableSkeleton from "./_components/CandidatesTableSkeleton";
import CandidatesBoardView from "./_components/CandidatesBoardView";
import { fetchStages } from "@/features/candidates/services/candidate-stages.service";
import { fetchCategories } from "@/features/candidates/services/candidate-taxonomy.service";

const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_PAGE_SIZES = [10, 25, 100];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminCandidatesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const stage = typeof sp.stage === "string" ? sp.stage : "all";
  const view = sp.view === "table" ? "table" : "board";
  const requestedPageSize = Number(sp.pageSize);
  const pageSize = ALLOWED_PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : DEFAULT_PAGE_SIZE;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const assignedTo = typeof sp.assignedTo === "string" ? sp.assignedTo : undefined;
  const actionDate = typeof sp.actionDate === "string" ? sp.actionDate : undefined;
  const actionPersonId = typeof sp.actionPersonId === "string" ? sp.actionPersonId : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const dir = sp.dir === "asc" || sp.dir === "desc" ? sp.dir : undefined;

  const [stages, categories] = await Promise.all([fetchStages(), fetchCategories()]);

  return (
    <AdminCandidatesShell
      stage={stage} view={view} stages={stages} categories={categories}
      category={category} assignedTo={assignedTo}
      actionDate={actionDate} actionPersonId={actionPersonId}
    >
      <CandidateImportPanel categories={categories} />
      {view === "board" ? (
        <CandidatesBoardView stages={stages} category={category} assignedTo={assignedTo} actionDate={actionDate} actionPersonId={actionPersonId} />
      ) : (
        <Suspense key={`${page}-${stage}-${pageSize}-${category}-${assignedTo}-${actionDate}-${actionPersonId}-${sort}-${dir}`} fallback={<CandidatesTableSkeleton />}>
          <CandidatesTableSection page={page} pageSize={pageSize} stage={stage} category={category} assignedTo={assignedTo} actionDate={actionDate} actionPersonId={actionPersonId} sort={sort} dir={dir} />
        </Suspense>
      )}
    </AdminCandidatesShell>
  );
}
