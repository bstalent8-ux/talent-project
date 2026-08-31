import { fetchAdminNotificationLogPage } from "@/features/admin/services/admin.service";
import NotificationLogView from "./NotificationLogView";

interface Props {
  page:     number;
  pageSize: number;
  type?:    string;
}

// Async Server Component — the only part of the page that suspends. Fetches
// exactly one page of the log, never the whole table.
export default async function NotificationLogSection({ page, pageSize, type }: Props) {
  const { notifications, total } = await fetchAdminNotificationLogPage({ page, pageSize, type });
  return <NotificationLogView notifications={notifications} total={total} page={page} pageSize={pageSize} type={type} />;
}
