import { fetchAdminVerificationsPage } from "@/features/admin/services/admin.service";
import VerificationsTable from "./VerificationsTable";

interface Props {
  page:     number;
  pageSize: number;
  status:   string;
  sort?:    string;
  dir?:     "asc" | "desc";
}

// Async Server Component — the only part of the page that suspends. Fetches
// exactly one page of verification requests, never the whole table.
export default async function VerificationsTableSection({ page, pageSize, status, sort, dir }: Props) {
  const { verifications, total } = await fetchAdminVerificationsPage({ page, pageSize, status, sort, dir });
  return <VerificationsTable verifications={verifications} total={total} page={page} pageSize={pageSize} status={status} sort={sort} dir={dir} />;
}
