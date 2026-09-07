"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useNotifications } from "@/hooks/notifications";
import NotificationDropdown from "./NotificationDropdown";
import styles from "@/components/SiteChrome.module.css";

interface Props {
  /** Forwarded to NotificationDropdown — see its own doc comment. */
  viewAllHref?: string;
  /** "auto" (default) opens toward the language's reading-start side, same
   *  as ever. "right" always opens toward the screen's right edge — for a
   *  bell that sits right next to a fixed left sidebar (AdminTopbar), so
   *  the panel grows into open canvas instead of over the sidebar. */
  align?: "auto" | "right";
}

export default function NotificationBell({ viewAllHref, align = "auto" }: Props) {
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
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Opening the panel is "viewing" the notifications — clears the badge the
  // way every other bell/inbox does, without requiring a separate "mark all
  // read" click. A short delay so it reads as "you looked at these", not an
  // instant flash the moment the icon is clicked.
  useEffect(() => {
    if (!open || unreadCount === 0) return;
    const timer = setTimeout(() => { markAllAsRead(); }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        ref={buttonRef}
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
          viewAllHref={viewAllHref}
          anchorEl={buttonRef.current}
          align={align}
        />
      )}
    </div>
  );
}
