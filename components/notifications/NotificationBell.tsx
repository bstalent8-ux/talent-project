"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useNotifications } from "@/hooks/notifications";
import NotificationDropdown from "./NotificationDropdown";
import styles from "@/components/SiteChrome.module.css";

export default function NotificationBell() {
  const { lang } = useSite();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const badgeCount = unreadCount > 99 ? "99+" : unreadCount;
  const label = lang === "ar" ? "الإشعارات" : "Notifications";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className={styles.notificationButton}
      >
        <Bell size={18} aria-hidden="true" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className={styles.notificationBadge}>
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onRead={markAsRead}
          onReadAll={markAllAsRead}
          onDelete={deleteNotification}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
