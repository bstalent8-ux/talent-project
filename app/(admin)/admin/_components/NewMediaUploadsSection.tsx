import { fetchAdminNewMediaUploads } from "@/features/admin/services/admin.service";
import NewMediaUploadsView from "./NewMediaUploadsView";

// Async Server Component — the only part of this card that suspends.
export default async function NewMediaUploadsSection() {
  const uploads = await fetchAdminNewMediaUploads();
  return <NewMediaUploadsView uploads={uploads} />;
}
