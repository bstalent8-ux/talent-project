import { fetchAdminBookingsPage } from "@/features/admin/services/admin.service";
import BookingsTable from "./BookingsTable";

interface Props {
  page:     number;
  pageSize: number;
  status:   string;
}

// Async Server Component — the only part of the page that suspends. Fetches
// exactly one page of bookings (Supabase range/count), never the whole table.
export default async function BookingsTableSection({ page, pageSize, status }: Props) {
  const { bookings, total } = await fetchAdminBookingsPage({ page, pageSize, status });
  return <BookingsTable bookings={bookings} total={total} page={page} pageSize={pageSize} status={status} />;
}
