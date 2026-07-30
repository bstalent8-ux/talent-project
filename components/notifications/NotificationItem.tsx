"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { Notification } from "@/lib/notifications/types";
import {
  PRIORITY_COLOR,
  TYPE_COLOR,
  TYPE_ICON,
  fallbackActionUrl,
  readI18n,
} from "@/lib/notifications/templates";

function timeAgo(dateStr: string, lang: "ar" | "en"): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (lang === "ar") {
    if (mins  < 1)  return "الآن";
    if (mins  < 60) return `منذ ${mins} د`;
    if (hours < 24) return `منذ ${hours} س`;
    return `منذ ${days} ي`;
  }
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface Props {
  notification: Notification;
  onRead:       (id: string) => void;
  onDelete?:    (id: string) => void;
  onNavigate?:  () => void;
  /** Roomier layout for the dedicated /notifications page. */
  compact?:     boolean;
}

export default function NotificationItem({
  notification: n,
  onRead,
  onDelete,
  onNavigate,
  compact = true,
}: Props) {
  const { lang, dark } = useSite();
  const router = useRouter();
  const isRTL  = lang === "ar";

  const accent = TYPE_COLOR[n.type] ?? "#6B7280";
  const icon   = TYPE_ICON[n.type]  ?? "🔔";
  const time   = timeAgo(n.created_at, lang);
  const href   = n.action_url ?? fallbackActionUrl(n.type, n.metadata);
  const { title, message } = readI18n(n, lang);

  const unreadBg = dark ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.05)";

  function handleClick() {
    if (!n.is_read) onRead(n.id);
    if (href) {
      onNavigate?.();
      router.push(href);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!href) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={href ? "button" : undefined}
      tabIndex={href ? 0 : undefined}
      aria-label={title}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        display:      "flex",
        alignItems:   "flex-start",
        gap:          "12px",
        padding:      compact ? "12px 16px" : "16px 18px",
        cursor:       href ? "pointer" : "default",
        background:   n.is_read ? "transparent" : unreadBg,
        borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
        transition:   "background 0.15s",
        position:     "relative",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = dark
          ? "rgba(255,255,255,0.04)"
          : "rgba(0,0,0,0.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = n.is_read ? "transparent" : unreadBg;
      }}
    >
      {/* Priority rail — only drawn when it carries information */}
      {(n.priority === "high" || n.priority === "urgent") && (
        <div style={{
          position: "absolute",
          top:      0,
          bottom:   0,
          [isRTL ? "right" : "left"]: 0,
          width:    "3px",
          background: PRIORITY_COLOR[n.priority],
        }} />
      )}

      {/* Icon circle */}
      <div style={{
        width:          compact ? "36px" : "42px",
        height:         compact ? "36px" : "42px",
        borderRadius:   "50%",
        background:     `${accent}20`,
        border:         `1.5px solid ${accent}40`,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       compact ? "16px" : "19px",
        flexShrink:     0,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:     compact ? "13px" : "14px",
          fontWeight:   n.is_read ? 400 : 600,
          color:        dark ? "#F1F5F9" : "#0F172A",
          whiteSpace:   "nowrap",
          overflow:     "hidden",
          textOverflow: "ellipsis",
        }}>
          {title}
        </div>
        <div style={{
          fontSize:        compact ? "12px" : "13px",
          color:           dark ? "#A8B3C2" : "#64748B",
          marginTop:       "2px",
          overflow:        "hidden",
          display:         "-webkit-box",
          WebkitLineClamp: compact ? 2 : 3,
          WebkitBoxOrient: "vertical",
        }}>
          {message}
        </div>
        <div style={{
          fontSize:   "11px",
          color:      accent,
          marginTop:  "4px",
          fontWeight: 500,
        }}>
          {time}
        </div>
      </div>

      {/* Trailing controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {!n.is_read && (
          <div style={{
            width:        "7px",
            height:       "7px",
            borderRadius: "50%",
            background:   accent,
          }} />
        )}

        {onDelete && (
          <button
            aria-label={isRTL ? "حذف الإشعار" : "Delete notification"}
            onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
            style={{
              background:   "none",
              border:       "none",
              cursor:       "pointer",
              padding:      "4px",
              borderRadius: "6px",
              color:        dark ? "#A8B3C2" : "#64748B",
              display:      "flex",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = dark ? "#A8B3C2" : "#64748B"; }}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
