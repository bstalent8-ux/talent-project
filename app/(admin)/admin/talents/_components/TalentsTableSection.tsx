import { fetchAdminTalentsPage } from "@/features/admin/services/admin.service";
import TalentsTable from "./TalentsTable";

interface Props {
  page:     number;
  pageSize: number;
  status:   string;
  category?: string;
  city?:     string;
  sort?:     string;
  dir?:      "asc" | "desc";
}

// Async Server Component — the only part of the page that suspends. Fetches
// exactly one page of talents (Supabase range/count + server-side status/
// category/city filters via talent_profiles!inner), never the whole table.
export default async function TalentsTableSection({ page, pageSize, status, category, city, sort, dir }: Props) {
  const { talents, total } = await fetchAdminTalentsPage({ page, pageSize, status, category, city, sort, dir });
  return <TalentsTable talents={talents} total={total} page={page} pageSize={pageSize} status={status} category={category} city={city} sort={sort} dir={dir} />;
}
