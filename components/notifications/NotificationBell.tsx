"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useNotifications } from "@/hooks/notifications";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const { dark, lang } = useSite();
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
        style={{
          position:       "relative",
          background:     "none",
          border:         "none",
          cursor:         "pointer",
          width:          "40px",
          height:         "40px",
          padding:        0,
          borderRadius:   "10px",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          transition:     "background 0.2s",
          color:          dark ? "#CBD5E1" : "#475569",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = dark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.06)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "none";
        }}
      >
        <Bell size={22} aria-hidden="true" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span style={{
            position:       "absolute",
            top:            "2px",
            right:          "2px",
            minWidth:       "16px",
            height:         "16px",
            background:     "#EF4444",
            color:          "#fff",
            fontSize:       "11px",
            fontWeight:     700,
            borderRadius:   "20px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            padding:        "0 3px",
            lineHeight:     1,
            boxShadow:      "0 0 0 2px " + (dark ? "#0F172A" : "#FFFFFF"),
          }}>
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
