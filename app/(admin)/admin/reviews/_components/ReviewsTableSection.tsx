import { fetchAdminReviewsPage } from "@/features/admin/services/admin.service";
import ReviewsTable from "./ReviewsTable";

interface Props {
  page:     number;
  pageSize: number;
  status:   string;
  sort?:    string;
  dir?:     "asc" | "desc";
}

// Async Server Component — the only part of the page that suspends. Fetches
// exactly one page of reviews, never the whole table.
export default async function ReviewsTableSection({ page, pageSize, status, sort, dir }: Props) {
  const { reviews, total } = await fetchAdminReviewsPage({ page, pageSize, status, sort, dir });
  return <ReviewsTable reviews={reviews} total={total} page={page} pageSize={pageSize} status={status} sort={sort} dir={dir} />;
}
