"use client";

import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import type { Notification } from "./useNotifications";

function timeAgo(dateStr: string, lang: "ar" | "en"): string {
  const diff = Date.now() - new Date(dateStr).getTime();
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

const TYPE_ICONS: Record<string, string> = {
  message:         "💬",
  job_application: "📋",
  brief:           "📄",
  booking:         "📅",
  payment:         "💳",
  review:          "⭐",
  system:          "🔔",
};

const TYPE_COLOR: Record<string, string> = {
  message:         "#0EA5E9",
  job_application: "#8B5CF6",
  brief:           "#F59E0B",
  booking:         "#10B981",
  payment:         "#EC4899",
  review:          "#F97316",
  system:          "#6B7280",
};

function buildHref(n: Notification): string | null {
  switch (n.type) {
    case "message":         return n.reference_id ? `/chat?conversation=${n.reference_id}` : "/chat";
    case "job_application": return n.reference_id ? `/jobs/${n.reference_id}/applications` : "/jobs";
    case "brief":           return n.reference_id ? `/bookings/${n.reference_id}` : "/bookings";
    case "booking":         return n.reference_id ? `/bookings/${n.reference_id}` : "/bookings";
    case "payment":         return n.reference_id ? `/bookings/${n.reference_id}` : "/bookings";
    case "review":          return "/profile";
    case "system":          return null;
    default:                return null;
  }
}

interface Props {
  notification: Notification;
  onRead: (id: string) => void;
}

export default function NotificationItem({ notification: n, onRead }: Props) {
  const { lang, dark } = useSite();
  const router = useRouter();
  const isRTL = lang === "ar";

  const accent = TYPE_COLOR[n.type] ?? "#6B7280";
  const icon   = TYPE_ICONS[n.type] ?? "🔔";
  const time   = timeAgo(n.created_at, lang);
  const href   = buildHref(n);

  function handleClick() {
    if (!n.is_read) onRead(n.id);
    if (href) router.push(href);
  }

  return (
    <div
      onClick={handleClick}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        display:         "flex",
        alignItems:      "flex-start",
        gap:             "12px",
        padding:         "12px 16px",
        cursor:          href ? "pointer" : "default",
        background:      n.is_read
          ? "transparent"
          : dark ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.05)",
        borderBottom:    dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
        transition:      "background 0.15s",
        position:        "relative",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = dark
          ? "rgba(255,255,255,0.04)"
          : "rgba(0,0,0,0.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = n.is_read
          ? "transparent"
          : dark ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.05)";
      }}
    >
      {/* Unread dot */}
      {!n.is_read && (
        <div style={{
          position:     "absolute",
          top:          "50%",
          [isRTL ? "left" : "right"]: "12px",
          transform:    "translateY(-50%)",
          width:        "6px",
          height:       "6px",
          borderRadius: "50%",
          background:   accent,
          flexShrink:   0,
        }} />
      )}

      {/* Icon circle */}
      <div style={{
        width:        "36px",
        height:       "36px",
        borderRadius: "50%",
        background:   `${accent}20`,
        border:       `1.5px solid ${accent}40`,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        fontSize:     "16px",
        flexShrink:   0,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:   "13px",
          fontWeight: n.is_read ? 400 : 600,
          color:      dark ? "#F1F5F9" : "#0F172A",
          whiteSpace: "nowrap",
          overflow:   "hidden",
          textOverflow: "ellipsis",
        }}>
          {n.title}
        </div>
        <div style={{
          fontSize:   "12px",
          color:      dark ? "#94A3B8" : "#64748B",
          marginTop:  "2px",
          overflow:   "hidden",
          display:    "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {n.message}
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
    </div>
  );
}
