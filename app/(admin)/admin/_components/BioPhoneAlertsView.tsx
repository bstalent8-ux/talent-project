"use client";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import type { AdminBioPhoneAlert } from "@/features/admin/services/admin.service";
import { ChevronDown, ChevronUp, Phone, X } from "lucide-react";

const COLLAPSE_STORAGE_KEY = "admin-dashboard-bio-phone-alerts-collapsed";

const TX = {
  ar: {
    title: "أرقام تليفونات مكتوبة في البايو",
    subtitle: "مخالفة لسياسة المنصة — بتخلي البراند يتواصل مباشرة من غير ما يعدي على التشات والحجز.",
    name: "الاسم", number: "الرقم المكتشف", review: "مراجعة الملف",
    bio: "نص البايو",
    none: "مفيش حد حاطط رقم تليفون في البايو دلوقتي",
    close: "إخفاء الكارت", reopen: "إظهار الكارت",
    results: (n: number) => `${n} حساب`,
  },
  en: {
    title: "Phone numbers written in bio",
    subtitle: "Against platform policy — lets a brand reach out directly, bypassing chat/booking.",
    name: "Name", number: "Detected number", review: "Review profile",
    bio: "Bio text",
    none: "No one currently has a phone number in their bio",
    close: "Hide card", reopen: "Show card",
    results: (n: number) => `${n} accounts`,
  },
};

export default function BioPhoneAlertsView({ alerts }: { alerts: AdminBioPhoneAlert[] }) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1") setCollapsed(true);
    } catch { /* ignore */ }
  }, []);
  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const TH = dark ? "#0a121c" : "#f8fafc";

  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle: React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };

  // Highlights every detected number inside the raw bio text so the admin
  // doesn't have to hunt for it in a long paragraph.
  function highlightBio(bio: string, numbers: string[]) {
    if (numbers.length === 0) return bio;
    const pattern = numbers.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const parts = bio.split(new RegExp(`(${pattern})`, "g"));
    return parts.map((part, i) =>
      numbers.includes(part)
        ? <mark key={i} style={{ backgroundColor: "rgba(239,68,68,0.25)", color: "#EF4444", fontWeight: 700, borderRadius: 4, padding: "0 3px" }}>{part}</mark>
        : <span key={i}>{part}</span>
    );
  }

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginTop: 24 }}>
      <div style={{ padding: "14px 16px", borderBottom: collapsed ? "none" : `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 6 }}>
            <Phone size={15} /> {t.title} ({alerts.length})
          </p>
          {!collapsed && <p style={{ margin: "4px 0 0", fontSize: 12, color: MUTED }}>{t.subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? t.reopen : t.close}
          style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 2, flexShrink: 0 }}
        >
          {collapsed ? <ChevronDown size={16} /> : <X size={16} />}
        </button>
      </div>

      {collapsed ? null : alerts.length === 0 ? (
        <EmptyState message={t.none} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>{t.name}</th>
                <th style={thStyle}>{t.number}</th>
                <th style={thStyle} />
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => {
                const isExpanded = expandedId === a.userId;
                return (
                  <Fragment key={a.userId}>
                    <tr onClick={() => setExpandedId(isExpanded ? null : a.userId)} style={{ cursor: "pointer" }}>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isExpanded ? <ChevronUp size={13} color={MUTED} /> : <ChevronDown size={13} color={MUTED} />}
                          <div>
                            <div style={{ fontWeight: 600 }}>{a.fullName ?? "—"}</div>
                            {a.handle && <div style={{ color: MUTED, fontSize: 11 }}>@{a.handle}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...cellStyle, direction: "ltr", textAlign: ar ? "right" : "left" }}>
                        {a.detectedNumbers.map((n) => (
                          <span key={n} style={{
                            display: "inline-block", marginInlineEnd: 6, padding: "2px 8px", borderRadius: 12,
                            fontSize: 12, fontWeight: 700, backgroundColor: "rgba(239,68,68,0.12)", color: "#EF4444",
                          }}>
                            {n}
                          </span>
                        ))}
                      </td>
                      <td style={{ ...cellStyle, width: 1, whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                        {a.talentProfileId && (
                          <Link
                            href={`/admin/talents/${a.talentProfileId}`}
                            style={{ color: "var(--color-primary)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                          >
                            {t.review}
                          </Link>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={3} style={{ ...cellStyle, backgroundColor: TH }}>
                          <div style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>{t.bio}</div>
                          <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                            {highlightBio(a.bio, a.detectedNumbers)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
