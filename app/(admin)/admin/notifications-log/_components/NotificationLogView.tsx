"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import CustomSelect from "@/components/ui/CustomSelect";
import type { AdminNotificationLogRow } from "@/features/admin/services/admin.service";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { TYPE_LABEL, TYPE_ICON, readI18n } from "@/lib/notifications/templates";
import { X } from "lucide-react";

const TX = {
  ar: {
    total: "إشعار", allTypes: "كل الأنواع",
    recipientCol: "المستلم", messageCol: "الرسالة", typeCol: "النوع",
    statusCol: "الحالة", dateCol: "التاريخ",
    read: "مقروء", unread: "غير مقروء",
    noNotifications: "لسه مفيش إشعارات",
    close: "إغلاق",
  },
  en: {
    total: "notifications", allTypes: "All types",
    recipientCol: "Recipient", messageCol: "Message", typeCol: "Type",
    statusCol: "Status", dateCol: "Date",
    read: "Read", unread: "Unread",
    noNotifications: "No notifications yet",
    close: "Close",
  },
};

interface Props {
  notifications: AdminNotificationLogRow[];
  total:         number;
  page:          number;
  pageSize:      number;
  type?:         string;
}

function hrefFor(page: number, type: string | undefined) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (type) params.set("type", type);
  const qs = params.toString();
  return `/admin/notifications-log${qs ? `?${qs}` : ""}`;
}

export default function NotificationLogView({ notifications, total, page, pageSize, type }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [selected, setSelected] = useState<AdminNotificationLogRow | null>(null);

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TH = dark ? "#0a121c" : "#f8fafc";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle: React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };

  function labelFor(n: AdminNotificationLogRow) {
    const known = TYPE_LABEL[n.type as keyof typeof TYPE_LABEL];
    return known ? known[lang] : n.type;
  }
  function contentFor(n: AdminNotificationLogRow) {
    return readI18n({ title: n.title, message: n.message, metadata: n.metadata }, lang);
  }

  function onTypeChange(next: string) {
    router.push(hrefFor(1, next || undefined));
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <span style={{ color: MUTED, fontSize: 12 }}>{total} {t.total}</span>
        <CustomSelect
          size="sm"
          value={type ?? ""}
          onChange={onTypeChange}
          style={{ width: "auto", minWidth: 160 }}
          colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#00D26A", hover: dark ? "#131F2E" : "#F1F5F9" }}
          options={[
            { value: "", label: t.allTypes },
            ...NOTIFICATION_TYPES.map((nt) => ({ value: nt, label: TYPE_LABEL[nt]?.[lang] ?? nt })),
          ]}
        />
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {notifications.length === 0 ? <EmptyState message={t.noNotifications} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.recipientCol}</th>
                  <th style={thStyle}>{t.messageCol}</th>
                  <th style={thStyle}>{t.typeCol}</th>
                  <th style={thStyle}>{t.statusCol}</th>
                  <th style={thStyle}>{t.dateCol}</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => {
                  const { title } = contentFor(n);
                  return (
                    <tr key={n.id} onClick={() => setSelected(n)} style={{ cursor: "pointer" }}>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600 }}>{n.recipientName ?? n.recipientHandle ?? n.recipientId}</div>
                        {n.recipientHandle && <div style={{ color: MUTED, fontSize: 11 }}>@{n.recipientHandle}</div>}
                      </td>
                      <td style={cellStyle}>{title}</td>
                      <td style={cellStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: "rgba(76,141,255,0.14)", color: "#4c8dff", whiteSpace: "nowrap" }}>
                          {TYPE_ICON[n.type as keyof typeof TYPE_ICON] ?? "🔔"} {labelFor(n)}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          backgroundColor: n.isRead ? "rgba(0,210,106,0.15)" : "rgba(148,163,184,0.15)",
                          color: n.isRead ? "#00D26A" : MUTED,
                        }}>
                          {n.isRead ? t.read : t.unread}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                        {new Date(n.createdAt).toLocaleString(ar ? "ar-EG" : "en-US")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={page} totalPages={totalPages} buildHref={(p) => hrefFor(p, type)} />

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: "min(480px, 100%)", maxHeight: "85vh", overflowY: "auto", padding: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h2 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{contentFor(selected).title}</h2>
                <div style={{ color: MUTED, fontSize: 12.5, marginTop: 4 }}>
                  {selected.recipientName ?? selected.recipientHandle ?? selected.recipientId}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ color: TEXT, fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{contentFor(selected).message}</p>

            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: "rgba(76,141,255,0.14)", color: "#4c8dff" }}>
                {labelFor(selected)}
              </span>
              <span style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                backgroundColor: selected.isRead ? "rgba(0,210,106,0.15)" : "rgba(148,163,184,0.15)",
                color: selected.isRead ? "#00D26A" : MUTED,
              }}>
                {selected.isRead ? t.read : t.unread}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
