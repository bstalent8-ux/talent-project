import { fetchPendingMediaPage, type PendingMediaStatus, type PendingMediaType } from "@/features/admin/services/pending-media.service";
import PendingMediaGrid from "./PendingMediaGrid";

interface Props {
  page:     number;
  pageSize: number;
  status:   PendingMediaStatus;
  type:     PendingMediaType;
  q:        string;
  migrated: boolean;
}

// Async Server Component — the only part of the page that suspends. Fetches exactly
// one page of the queue for the current status / type / search.
export default async function PendingMediaSection({ page, pageSize, status, type, q, migrated }: Props) {
  const { items, total } = await fetchPendingMediaPage({ page, pageSize, status, type, q });
  return <PendingMediaGrid items={items} total={total} page={page} pageSize={pageSize} status={status} type={type} q={q} migrated={migrated} />;
}
