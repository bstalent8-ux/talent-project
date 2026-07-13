"use client";

import { useSite } from "@/contexts/SiteContext";
import type { Notification } from "./useNotifications";
import NotificationItem from "./NotificationItem";

interface Props {
  notifications: Notification[];
  loading:       boolean;
  onRead:        (id: string) => void;
  onReadAll:     () => void;
  onClose:       () => void;
}

export default function NotificationDropdown({
  notifications,
  loading,
  onRead,
  onReadAll,
  onClose,
}: Props) {
  const { lang, dark } = useSite();
  const isRTL = lang === "ar";

  const surface = dark ? "#1E293B" : "#FFFFFF";
  const border  = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const shadow  = dark
    ? "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)"
    : "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)";

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset:    0,
          zIndex:   998,
        }}
      />

      {/* Panel */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          position:     "absolute",
          top:          "calc(100% + 12px)",
          [isRTL ? "left" : "right"]: 0,
          width:        "360px",
          maxHeight:    "480px",
          borderRadius: "16px",
          background:   surface,
          border:       `1px solid ${border}`,
          boxShadow:    shadow,
          zIndex:       999,
          display:      "flex",
          flexDirection: "column",
          overflow:     "hidden",
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
              fontSize:   "15px",
              fontWeight: 700,
              color:      dark ? "#F1F5F9" : "#0F172A",
            }}>
              {isRTL ? "الإشعارات" : "Notifications"}
            </span>
            {unread > 0 && (
              <span style={{
                background:   "linear-gradient(135deg,#0EA5E9,#6366F1)",
                color:        "#fff",
                fontSize:     "10px",
                fontWeight:   700,
                padding:      "2px 7px",
                borderRadius: "20px",
              }}>
                {unread}
              </span>
            )}
          </div>

          {unread > 0 && (
            <button
              onClick={onReadAll}
              style={{
                background: "none",
                border:     "none",
                cursor:     "pointer",
                fontSize:   "12px",
                color:      "#0EA5E9",
                fontWeight: 500,
                padding:    "4px 8px",
                borderRadius: "6px",
              }}
            >
              {isRTL ? "قراءة الكل" : "Mark all read"}
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{
              padding:    "40px 16px",
              textAlign:  "center",
              color:      dark ? "#64748B" : "#94A3B8",
              fontSize:   "13px",
            }}>
              {isRTL ? "جاري التحميل..." : "Loading..."}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{
              padding:   "48px 16px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔔</div>
              <div style={{
                color:    dark ? "#64748B" : "#94A3B8",
                fontSize: "13px",
              }}>
                {isRTL ? "لا توجد إشعارات" : "No notifications yet"}
              </div>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={onRead}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{
            borderTop:  `1px solid ${border}`,
            padding:    "10px 16px",
            flexShrink: 0,
          }}>
            <button
              onClick={onClose}
              style={{
                width:        "100%",
                padding:      "8px",
                background:   dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                border:       `1px solid ${border}`,
                borderRadius: "10px",
                cursor:       "pointer",
                fontSize:     "12px",
                color:        dark ? "#94A3B8" : "#64748B",
                fontWeight:   500,
              }}
            >
              {isRTL ? "إغلاق" : "Close"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
