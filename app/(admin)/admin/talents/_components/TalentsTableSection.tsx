import { fetchAdminTalentsPage, type TalentDuplicateFilter } from "@/features/admin/services/admin.service";
import TalentsTable from "./TalentsTable";

interface Props {
  page:     number;
  pageSize: number;
  status:   string;
  category?: string;
  city?:     string;
  sort?:     string;
  dir?:      "asc" | "desc";
  duplicate?: TalentDuplicateFilter;
  q?: string;
}

// Async Server Component — the only part of the page that suspends. Fetches
// exactly one page of talents (Supabase range/count + server-side status/
// category/city filters via talent_profiles!inner), never the whole table.
export default async function TalentsTableSection({ page, pageSize, status, category, city, sort, dir, duplicate, q }: Props) {
  const { talents, total, duplicateTotal } = await fetchAdminTalentsPage({ page, pageSize, status, category, city, sort, dir, duplicate, q });
  return <TalentsTable talents={talents} total={total} duplicateTotal={duplicateTotal} page={page} pageSize={pageSize} status={status} category={category} city={city} sort={sort} dir={dir} duplicate={duplicate} q={q} />;
}
