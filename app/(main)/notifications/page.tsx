export const runtime = 'edge';

import NotificationsClient from "./_components/NotificationsClient";

export const metadata = {
  title: "الإشعارات | Notifications",
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
