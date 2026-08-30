import { fetchAdminEmailLogPage } from "@/features/admin/services/admin.service";
import EmailLogView from "./EmailLogView";

interface Props {
  page:     number;
  pageSize: number;
}

// Async Server Component — the only part of the page that suspends. Fetches
// exactly one page of the log, never the whole table.
export default async function EmailLogSection({ page, pageSize }: Props) {
  const { emails, total } = await fetchAdminEmailLogPage({ page, pageSize });
  return <EmailLogView emails={emails} total={total} page={page} pageSize={pageSize} />;
}
