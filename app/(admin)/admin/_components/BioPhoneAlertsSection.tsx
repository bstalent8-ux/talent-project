import { fetchAdminBioPhoneAlerts } from "@/features/admin/services/admin.service";
import BioPhoneAlertsView from "./BioPhoneAlertsView";

// Async Server Component — the only part of this card that suspends.
export default async function BioPhoneAlertsSection() {
  const alerts = await fetchAdminBioPhoneAlerts();
  return <BioPhoneAlertsView alerts={alerts} />;
}
