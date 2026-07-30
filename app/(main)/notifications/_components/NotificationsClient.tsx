"use client";

import { useMemo, useState } from "react";
import { BellOff, CheckCheck } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNotifications } from "@/hooks/notifications";
import NotificationItem from "@/components/notifications/NotificationItem";

const TX = {
  ar: {
    title:    "الإشعارات",
    subtitle: "كل التحديثات الخاصة بحسابك",
    all:      "الكل",
    unread:   "غير المقروءة",
    readAll:  "تعليم الكل كمقروء",
    loading:  "جاري التحميل...",
    loadMore: "تحميل المزيد",
    emptyAll:    "لا توجد إشعارات بعد",
    emptyUnread: "لا توجد إشعارات غير مقروءة",
    emptyHint:   "ستظهر هنا التحديثات عن الوظائف والحجوزات والرسائل.",
    error:    "تعذّر تحميل الإشعارات.",
  },
  en: {
    title:    "Notifications",
    subtitle: "Everything happening on your account",
    all:      "All",
    unread:   "Unread",
    readAll:  "Mark all as read",
    loading:  "Loading...",
    loadMore: "Load more",
    emptyAll:    "No notifications yet",
    emptyUnread: "No unread notifications",
    emptyHint:   "Updates about jobs, bookings and messages will show up here.",
    error:    "Couldn't load notifications.",
  },
};

type Tab = "all" | "unread";

export default function NotificationsClient() {
  const { dark, lang } = useSite();
  const isMobile = useIsMobile();
  const ar = lang === "ar";
  const tx = TX[lang];

  const {
    notifications,
    unreadCount,
    hasMore,
    loading,
    loadingMore,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  } = useNotifications();

  const [tab, setTab] = useState<Tab>("all");

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#F1F5F9" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const GREEN  = "#00D26A";

  const visible = useMemo(
    () => (tab === "unread" ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, tab]
  );

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      style={{
        maxWidth: 760,
        margin:   "0 auto",
        padding:  isMobile ? "24px 16px 64px" : "48px 24px 96px",
      }}
    >
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display:        "flex",
        alignItems:     "flex-start",
        justifyContent: "space-between",
        gap:            16,
        flexWrap:       "wrap",
        marginBottom:   24,
      }}>
        <div>
          <h1 style={{
            fontSize:   isMobile ? 24 : 30,
            fontWeight: 800,
            color:      TEXT,
            margin:     0,
          }}>
            {tx.title}
          </h1>
          <p style={{ color: MUTED, fontSize: 14, margin: "6px 0 0" }}>
            {tx.subtitle}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          8,
              padding:      "9px 14px",
              borderRadius: 10,
              border:       `1px solid ${BORDER}`,
              background:   dark ? "rgba(0,210,106,0.08)" : "rgba(0,210,106,0.06)",
              color:        GREEN,
              fontSize:     13,
              fontWeight:   600,
              cursor:       "pointer",
            }}
          >
            <CheckCheck size={16} />
            {tx.readAll}
          </button>
        )}
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["all", "unread"] as Tab[]).map((key) => {
          const active = tab === key;
          const label  = key === "all" ? tx.all : tx.unread;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          6,
                padding:      "8px 16px",
                borderRadius: 999,
                border:       `1px solid ${active ? GREEN : BORDER}`,
                background:   active ? "rgba(0,210,106,0.12)" : "transparent",
                color:        active ? GREEN : MUTED,
                fontSize:     13,
                fontWeight:   active ? 700 : 500,
                cursor:       "pointer",
                transition:   "all 0.18s",
              }}
            >
              {label}
              {key === "unread" && unreadCount > 0 && (
                <span style={{
                  background:   GREEN,
                  color:        "#0D1623",
                  fontSize:     11,
                  fontWeight:   700,
                  borderRadius: 999,
                  padding:      "1px 7px",
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── List ────────────────────────────────────────────────────────── */}
      <div style={{
        background:   CARD,
        border:       `1px solid ${BORDER}`,
        borderRadius: 16,
        overflow:     "hidden",
      }}>
        {loading ? (
          <div style={{ padding: "64px 16px", textAlign: "center", color: MUTED, fontSize: 14 }}>
            {tx.loading}
          </div>
        ) : error ? (
          <div style={{ padding: "64px 16px", textAlign: "center", color: "#EF4444", fontSize: 14 }}>
            {tx.error}
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: "72px 24px", textAlign: "center" }}>
            <BellOff size={34} color={MUTED} style={{ marginBottom: 12 }} />
            <div style={{ color: TEXT, fontSize: 15, fontWeight: 600 }}>
              {tab === "unread" ? tx.emptyUnread : tx.emptyAll}
            </div>
            <div style={{ color: MUTED, fontSize: 13, marginTop: 6 }}>
              {tx.emptyHint}
            </div>
          </div>
        ) : (
          visible.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={markAsRead}
              onDelete={deleteNotification}
              compact={false}
            />
          ))
        )}
      </div>

      {/* ─── Pagination ──────────────────────────────────────────────────── */}
      {hasMore && !loading && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              padding:      "11px 26px",
              borderRadius: 12,
              border:       `1px solid ${BORDER}`,
              background:   "transparent",
              color:        loadingMore ? MUTED : TEXT,
              fontSize:     14,
              fontWeight:   600,
              cursor:       loadingMore ? "default" : "pointer",
            }}
          >
            {loadingMore ? tx.loading : tx.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
