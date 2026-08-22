import { fetchAdminTalentTypeStats, fetchAdminTalentTypeRequestsPage } from "@/features/admin/services/admin.service";
import TalentDemandView from "./TalentDemandView";

interface Props {
  page:     number;
  pageSize: number;
  from?:    string;
  to?:      string;
}

// Async Server Component — the only part of the page that suspends. Runs
// the aggregate stats (count-only queries, full date range) and the
// paginated request list (range/count, one page) in parallel — neither one
// fetches the whole table.
export default async function TalentDemandSection({ page, pageSize, from, to }: Props) {
  const [stats, { requests, total }] = await Promise.all([
    fetchAdminTalentTypeStats({ from, to }),
    fetchAdminTalentTypeRequestsPage({ page, pageSize, from, to }),
  ]);

  return <TalentDemandView stats={stats} requests={requests} total={total} page={page} pageSize={pageSize} from={from} to={to} />;
}
