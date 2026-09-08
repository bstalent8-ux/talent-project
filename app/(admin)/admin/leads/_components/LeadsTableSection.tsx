import { fetchLeadsPage } from "@/features/leads/services/leads.service";
import LeadsTable from "./LeadsTable";

interface Props {
  page: number;
  pageSize: number;
  stage: string;
  channel?: string;
  category?: string;
  assignedTo?: string;
  actionDate?: string;
  actionPersonId?: string;
}

// Async Server Component — the only part of the page that suspends.
export default async function LeadsTableSection({ page, pageSize, stage, channel, category, assignedTo, actionDate, actionPersonId }: Props) {
  const { leads, total } = await fetchLeadsPage({ page, pageSize, stage, channel, category, assignedTo, actionDate, actionPersonId });
  return <LeadsTable leads={leads} total={total} page={page} pageSize={pageSize} stage={stage} channel={channel} category={category} assignedTo={assignedTo} actionDate={actionDate} actionPersonId={actionPersonId} />;
}
