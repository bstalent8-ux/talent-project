"use client";

import Link from "next/link";
import { BellOff } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { Notification } from "@/lib/notifications/types";
import NotificationItem from "./NotificationItem";

interface Props {
  notifications: Notification[];
  unreadCount:   number;
  loading:       boolean;
  onRead:        (id: string) => void;
  onReadAll:     () => void;
  onDelete:      (id: string) => void;
  onClose:       () => void;
}

const TX = {
  ar: {
    title:   "الإشعارات",
    readAll: "قراءة الكل",
    loading: "جاري التحميل...",
    empty:   "لا توجد إشعارات",
    viewAll: "عرض كل الإشعارات",
  },
  en: {
    title:   "Notifications",
    readAll: "Mark all read",
    loading: "Loading...",
    empty:   "No notifications yet",
    viewAll: "View all notifications",
  },
};

export default function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  onRead,
  onReadAll,
  onDelete,
  onClose,
}: Props) {
  const { lang, dark } = useSite();
  const isRTL = lang === "ar";
  const tx    = TX[lang];

  const surface = dark ? "#1E293B" : "#FFFFFF";
  const border  = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const text    = dark ? "#F1F5F9" : "#0F172A";
  const muted   = dark ? "#A8B3C2" : "#64748B";
  const green   = "#00D26A";
  const shadow  = dark
    ? "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)"
    : "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)";

  // The dropdown is a peek at the top of the feed — the full history lives on
  // /notifications, so it never renders more than 10 rows.
  const preview = notifications.slice(0, 10);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 998 }} />

      {/* Panel */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          position:      "absolute",
          top:           "calc(100% + 12px)",
          [isRTL ? "left" : "right"]: 0,
          width:         "360px",
          maxWidth:      "calc(100vw - 24px)",
          maxHeight:     "480px",
          borderRadius:  "16px",
          background:    surface,
          border:        `1px solid ${border}`,
          boxShadow:     shadow,
          zIndex:        999,
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "16px 16px 12px",
          borderBottom:   `1px solid ${border}`,
          flexShrink:     0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontSize:   "14px",
              fontWeight: 700,
              color:      text,
            }}>
              {tx.title}
            </span>
            {unreadCount > 0 && (
              <span style={{
                background:   green,
                color:        "#0D1623",
                fontSize:     "11px",
                fontWeight:   700,
                padding:      "2px 7px",
                borderRadius: "20px",
              }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onReadAll}
              style={{
                background:   "none",
                border:       "none",
                cursor:       "pointer",
                fontSize:     "13px",
                color:        dark ? green : text,
                fontWeight:   600,
                padding:      "4px 8px",
                borderRadius: "6px",
              }}
            >
              {tx.readAll}
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{
              padding:   "40px 16px",
              textAlign: "center",
              color:     muted,
              fontSize:  "13px",
            }}>
              {tx.loading}
            </div>
          ) : preview.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center" }}>
              <BellOff size={32} color={muted} style={{ marginBottom: "8px" }} />
              <div style={{ color: muted, fontSize: "13px" }}>
                {tx.empty}
              </div>
            </div>
          ) : (
            preview.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={onRead}
                onDelete={onDelete}
                onNavigate={onClose}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop:  `1px solid ${border}`,
          padding:    "10px 16px",
          flexShrink: 0,
        }}>
          <Link
            href="/notifications"
            onClick={onClose}
            style={{
              display:        "block",
              width:          "100%",
              padding:        "8px",
              background:     dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              border:         `1px solid ${border}`,
              borderRadius:   "10px",
              fontSize:       "13px",
              color:          muted,
              fontWeight:     600,
              textAlign:      "center",
              textDecoration: "none",
            }}
          >
            {tx.viewAll}
          </Link>
        </div>
      </div>
    </>
  );
}
