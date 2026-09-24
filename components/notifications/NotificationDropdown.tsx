"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { BellOff } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { Notification } from "@/lib/notifications/types";
import NotificationItem from "./NotificationItem";

const PANEL_WIDTH = 360;
const VIEWPORT_MARGIN = 12;

interface Props {
  notifications: Notification[];
  unreadCount:   number;
  loading:       boolean;
  onRead:        (id: string) => void;
  onReadAll:     () => void;
  onDelete:      (id: string) => void;
  onClose:       () => void;
  /** Set by the bell for MODAL_CLOSE_MS after it closes so the exit plays. */
  closing?:      boolean;
  /** Where "View all notifications" goes — the admin topbar points this at
   * its own full-history page instead of the public /notifications page,
   * which middleware.ts bounces an admin session away from. */
  viewAllHref?:  string;
  /** The bell button — panel position is computed from its real screen
   *  rect and portaled to <body> (see NotificationBell), so a fixed left
   *  sidebar (or any ancestor's overflow/transform) can never clip or
   *  bury it regardless of how high its own z-index is. */
  anchorEl?:     HTMLElement | null;
  /** "auto" opens toward the language's reading-start side (old default
   *  behavior). "right" always opens toward the screen's right edge —
   *  see NotificationBell's doc comment. */
  align?:        "auto" | "right";
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
  closing = false,
  viewAllHref = "/notifications",
  anchorEl,
  align = "auto",
}: Props) {
  const { lang, dark } = useSite();
  const isRTL = lang === "ar";
  const tx    = TX[lang];

  // Real screen coordinates, not a CSS anchor — see anchorEl's doc comment.
  // Falls back to a top-right guess only if somehow mounted with no button
  // yet measured (shouldn't happen: NotificationBell only renders this
  // after its own ref is attached).
  const rect = anchorEl?.getBoundingClientRect();
  const top = (rect?.bottom ?? 0) + 12;
  let left: number;
  if (rect) {
    if (align === "right") {
      // Grow rightward from the button's own left edge, clamped so it
      // never runs off the right side of the viewport.
      left = Math.min(rect.left, window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN);
    } else if (isRTL) {
      left = rect.left;
    } else {
      left = rect.right - PANEL_WIDTH;
    }
    left = Math.max(VIEWPORT_MARGIN, left);
  } else {
    left = window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN;
  }

  const surface = "var(--bg-card)";
  const border  = "var(--border-subtle)";
  const text    = "var(--text-primary)";
  const muted   = "var(--text-muted)";
  const green   = "var(--color-primary-text)";
  const shadow  = dark
    ? "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(245,238,219,0.06)"
    : "0 20px 60px rgba(43,33,29,0.18), 0 0 0 1px rgba(43,33,29,0.06)";

  // The dropdown is a peek at the top of the feed — the full history lives on
  // /notifications, so it never renders more than 10 rows.
  const preview = notifications.slice(0, 10);

  return createPortal(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 998 }} />

      {/* Panel — portaled to <body> and positioned from the bell's real
          screen rect (not a CSS anchor on a relative-positioned parent) so
          a fixed sidebar's stacking context, or any ancestor's overflow,
          can never clip or bury it. */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="popover-panel"
        data-state={closing ? "closing" : "open"}
        style={{
          position:      "fixed",
          top,
          left,
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
                background:   "var(--color-primary)",
                color:        "var(--color-primary-ink)",
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
            href={viewAllHref}
            onClick={onClose}
            style={{
              display:        "block",
              width:          "100%",
              padding:        "8px",
              background:     dark ? "rgba(245,238,219,0.06)" : "rgba(43,33,29,0.05)",
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
    </>,
    document.body
  );
}
