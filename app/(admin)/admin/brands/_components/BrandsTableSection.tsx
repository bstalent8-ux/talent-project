import { fetchAdminBrandsPage } from "@/features/admin/services/admin.service";
import BrandsTable from "./BrandsTable";

interface Props {
  page:     number;
  pageSize: number;
  status:   string;
}

// Async Server Component — the only part of the page that suspends. Fetches
// exactly one page of brands, never the whole table.
export default async function BrandsTableSection({ page, pageSize, status }: Props) {
  const { brands, total } = await fetchAdminBrandsPage({ page, pageSize, status });
  return <BrandsTable brands={brands} total={total} page={page} pageSize={pageSize} status={status} />;
}
