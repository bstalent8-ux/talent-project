"use client";

import { useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import { useNotifications } from "./useNotifications";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const { dark } = useSite();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const badgeCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          position:     "relative",
          background:   "none",
          border:       "none",
          cursor:       "pointer",
          padding:      "8px",
          borderRadius: "10px",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          transition:   "background 0.2s",
          color:        dark ? "#CBD5E1" : "#475569",
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
        {/* Bell SVG */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          {unreadCount > 0 && (
            <circle cx="18" cy="5" r="4" fill="#EF4444" stroke="none" />
          )}
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span style={{
            position:     "absolute",
            top:          "2px",
            right:        "2px",
            minWidth:     "16px",
            height:       "16px",
            background:   "linear-gradient(135deg,#EF4444,#DC2626)",
            color:        "#fff",
            fontSize:     "9px",
            fontWeight:   700,
            borderRadius: "20px",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            padding:      "0 3px",
            lineHeight:   1,
            boxShadow:    "0 0 0 2px " + (dark ? "#0F172A" : "#FFFFFF"),
          }}>
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          onRead={markAsRead}
          onReadAll={markAllAsRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
