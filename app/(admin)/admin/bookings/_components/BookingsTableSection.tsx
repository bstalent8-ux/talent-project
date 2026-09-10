import { fetchAdminBookingsPage } from "@/features/admin/services/admin.service";
import BookingsTable from "./BookingsTable";

interface Props {
  page:     number;
  pageSize: number;
  status:   string;
  sort?:    string;
  dir?:     "asc" | "desc";
}

// Async Server Component — the only part of the page that suspends. Fetches
// exactly one page of bookings (Supabase range/count), never the whole table.
export default async function BookingsTableSection({ page, pageSize, status, sort, dir }: Props) {
  const { bookings, total } = await fetchAdminBookingsPage({ page, pageSize, status, sort, dir });
  return <BookingsTable bookings={bookings} total={total} page={page} pageSize={pageSize} status={status} sort={sort} dir={dir} />;
}
