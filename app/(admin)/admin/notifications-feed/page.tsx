export const runtime = 'edge';

// ─── Admin's own notification history ──────────────────────────────────────
// Distinct from /admin/notifications (the "send an announcement" composer,
// still reachable from AdminSidebar). This is where the topbar bell's "View
// all notifications" goes — the public /notifications page works the same
// way but middleware.ts bounces any admin session away from non-/admin
// routes, so a dedicated admin-shell page is needed instead of reusing it
// directly.

import AdminShell from "@/components/admin/AdminShell";
import NotificationsClient from "@/app/(main)/notifications/_components/NotificationsClient";

export default function AdminNotificationsFeedPage() {
  return (
    <AdminShell title="الإشعارات">
      <NotificationsClient />
    </AdminShell>
  );
}
