import { fetchAdminSupportTicketsPage } from "@/features/admin/services/admin.service";
import SupportTicketsView from "./SupportTicketsView";

interface Props {
  page:            number;
  pageSize:        number;
  status:          string;
  emailConfigured: boolean;
}

// Async Server Component — the only part of the page that suspends. Fetches
// exactly one page of tickets, never the whole table.
export default async function SupportTicketsSection({ page, pageSize, status, emailConfigured }: Props) {
  const { tickets, total } = await fetchAdminSupportTicketsPage({ page, pageSize, status });
  return <SupportTicketsView tickets={tickets} total={total} page={page} pageSize={pageSize} status={status} emailConfigured={emailConfigured} />;
}
