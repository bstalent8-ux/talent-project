import { fetchAdminUserActivityStats, fetchAdminUserActivityPage, fetchAdminUserActivityVisitors, fetchAdminTrafficSources, type UserEventName } from "@/features/admin/services/admin.service";
import UserActivityView from "./UserActivityView";

interface Props {
  page:       number;
  pageSize:   number;
  from?:      string;
  to?:        string;
  eventName?: string;
}

// Async Server Component — the only part of the page that suspends. Runs
// the aggregate stats (count-only queries, full date range) and the
// paginated event list (range/count, one page) in parallel — neither one
// fetches the whole table. Mirrors TalentDemandSection.
export default async function UserActivitySection({ page, pageSize, from, to, eventName }: Props) {
  const typedEventName = eventName as UserEventName | undefined;
  const [stats, { events, total }, visitors, trafficSources] = await Promise.all([
    fetchAdminUserActivityStats({ from, to }),
    fetchAdminUserActivityPage({ page, pageSize, from, to, eventName: typedEventName }),
    fetchAdminUserActivityVisitors({ from, to }),
    fetchAdminTrafficSources({ from, to }),
  ]);

  return (
    <UserActivityView
      stats={stats} events={events} total={total} visitors={visitors} trafficSources={trafficSources}
      page={page} pageSize={pageSize} from={from} to={to} eventName={eventName}
    />
  );
}
