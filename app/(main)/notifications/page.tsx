export const runtime = 'edge';
export const dynamic = "force-dynamic";

import NotificationsClient from "./_components/NotificationsClient";

export const metadata = {
  title: "الإشعارات | Notifications",
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
