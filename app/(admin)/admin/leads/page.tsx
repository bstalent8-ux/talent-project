export const runtime = 'edge';
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminLeadsShell from "./_components/AdminLeadsShell";
import LeadImportPanel from "./_components/LeadImportPanel";
import LeadsTableSection from "./_components/LeadsTableSection";
import LeadsTableSkeleton from "./_components/LeadsTableSkeleton";
import LeadsBoardView from "./_components/LeadsBoardView";
import { fetchStages } from "@/features/leads/services/lead-stages.service";
import { fetchTerms } from "@/features/leads/services/lead-taxonomy.service";

const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_PAGE_SIZES = [10, 25, 100];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const stage = typeof sp.stage === "string" ? sp.stage : "all";
  // Board (every stage visible at once, no clicking a tab to switch) is the
  // default — table is the explicit opt-in for a flat sortable/paginated list.
  const view = sp.view === "table" ? "table" : "board";
  const requestedPageSize = Number(sp.pageSize);
  const pageSize = ALLOWED_PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : DEFAULT_PAGE_SIZE;
  const channel = typeof sp.channel === "string" ? sp.channel : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const assignedTo = typeof sp.assignedTo === "string" ? sp.assignedTo : undefined;

  const [stages, channels, categories] = await Promise.all([
    fetchStages(),
    fetchTerms("lead_channels"),
    fetchTerms("lead_categories"),
  ]);

  return (
    <AdminLeadsShell
      stage={stage} view={view} stages={stages} channels={channels} categories={categories}
      channel={channel} category={category} assignedTo={assignedTo}
    >
      <LeadImportPanel channels={channels} categories={categories} />
      {view === "board" ? (
        <LeadsBoardView stages={stages} channel={channel} category={category} assignedTo={assignedTo} />
      ) : (
        <Suspense key={`${page}-${stage}-${pageSize}-${channel}-${category}-${assignedTo}`} fallback={<LeadsTableSkeleton />}>
          <LeadsTableSection page={page} pageSize={pageSize} stage={stage} channel={channel} category={category} assignedTo={assignedTo} />
        </Suspense>
      )}
    </AdminLeadsShell>
  );
}
