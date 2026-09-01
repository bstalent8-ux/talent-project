import { fetchAdminIncompleteSignups } from "@/features/admin/services/admin.service";
import IncompleteSignupsView from "./IncompleteSignupsView";

// Async Server Component — the only part of this card that suspends.
export default async function IncompleteSignupsSection() {
  const signups = await fetchAdminIncompleteSignups();
  return <IncompleteSignupsView signups={signups} />;
}
