import { fetchLeadsPage } from "@/features/leads/services/leads.service";
import LeadsTable from "./LeadsTable";

interface Props {
  page: number;
  pageSize: number;
  status: string;
}

// Async Server Component — the only part of the page that suspends.
export default async function LeadsTableSection({ page, pageSize, status }: Props) {
  const { leads, total } = await fetchLeadsPage({ page, pageSize, status });
  return <LeadsTable leads={leads} total={total} page={page} pageSize={pageSize} status={status} />;
}
