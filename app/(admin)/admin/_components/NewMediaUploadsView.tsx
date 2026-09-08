"use client";
import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import EmptyState from "@/components/admin/EmptyState";
import type { AdminNewMediaUpload } from "@/features/admin/services/admin.service";
import { CheckCircle, ChevronDown, ChevronUp, ImagePlus, X } from "lucide-react";
import { ADMIN_LIGHT } from "@/components/admin/adminLightTheme";

const COLLAPSE_STORAGE_KEY = "admin-dashboard-new-media-uploads-collapsed";

const TX = {
  ar: {
    title: "صور وفيديوهات جديدة اتضافت",
    subtitle: "تالنتس لسه قيد الانتظار وضافوا بورتفوليو — جاهزين تراجعهم وتعتمدهم",
    name: "الاسم", media: "المحتوى", latest: "آخر رفع",
    account: "الحساب", email: "الإيميل", registeredAt: "تاريخ التسجيل",
    approve: "اعتماد", approving: "بيتم الاعتماد...", approved: "اتعمد ✓",
    photos: (n: number) => `${n} صورة`,
    videos: (n: number) => `${n} فيديو`,
    none: "مفيش حد pending ضاف صور أو فيديوهات جديدة دلوقتي",
    close: "إخفاء الكارت", reopen: "إظهار الكارت",
    results: (n: number) => `${n} حساب`,
  },
  en: {
    title: "New media uploaded",
    subtitle: "Pending talents who've added portfolio content — ready to review and approve",
    name: "Name", media: "Content", latest: "Latest upload",
    account: "Account", email: "Email", registeredAt: "Registered",
    approve: "Approve", approving: "Approving...", approved: "Approved ✓",
    photos: (n: number) => `${n} photo${n === 1 ? "" : "s"}`,
    videos: (n: number) => `${n} video${n === 1 ? "" : "s"}`,
    none: "No pending talent has added new photos or videos right now",
    close: "Hide card", reopen: "Show card",
    results: (n: number) => `${n} accounts`,
  },
};

export default function NewMediaUploadsView({ uploads }: { uploads: AdminNewMediaUpload[] }) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Whole-card collapse — persisted, same pattern as the incomplete-signups
  // card right above this one.
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

  const CARD = dark ? "#0D1623" : ADMIN_LIGHT.card;
  const BORDER = dark ? "#1e293b" : ADMIN_LIGHT.border;
  const TEXT = dark ? "#f1f5f9" : ADMIN_LIGHT.text;
  const MUTED = dark ? "#94a3b8" : ADMIN_LIGHT.muted;
  const TH = dark ? "#0a121c" : ADMIN_LIGHT.tableHead;
  const PRIMARY = dark ? "var(--color-primary)" : ADMIN_LIGHT.primary;

  async function approve(talentProfileId: string) {
    setApprovingId(talentProfileId);
    await fetch(`/api/admin/talents/${talentProfileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    }).catch(() => {});
    setApprovingId(null);
    setApprovedIds((prev) => new Set(prev).add(talentProfileId));
    router.refresh();
  }

  const cellStyle: React.CSSProperties = { padding: "12px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const thStyle: React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginTop: 24 }}>
      <div style={{ padding: "14px 16px", borderBottom: collapsed ? "none" : `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 6 }}>
            <ImagePlus size={15} /> {t.title} ({uploads.length})
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

      {collapsed ? null : uploads.length === 0 ? (
        <EmptyState message={t.none} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>{t.name}</th>
                <th style={thStyle}>{t.media}</th>
                <th style={thStyle}>{t.latest}</th>
                <th style={thStyle} />
              </tr>
            </thead>
            <tbody>
              {uploads.map((u) => {
                const isApproved = approvedIds.has(u.talentProfileId);
                const isExpanded = expandedId === u.userId;
                return (
                  <Fragment key={u.userId}>
                    <tr onClick={() => setExpandedId(isExpanded ? null : u.userId)} style={{ cursor: "pointer" }}>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isExpanded ? <ChevronUp size={13} color={MUTED} /> : <ChevronDown size={13} color={MUTED} />}
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.fullName ?? "—"}</div>
                            {u.handle && <div style={{ color: MUTED, fontSize: 11 }}>@{u.handle}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                        {[u.photoCount > 0 ? t.photos(u.photoCount) : null, u.videoCount > 0 ? t.videos(u.videoCount) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </td>
                      <td style={{ ...cellStyle, color: MUTED, whiteSpace: "nowrap" }}>
                        {new Date(u.latestUploadAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td style={{ ...cellStyle, width: 1, whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                        {isApproved ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#00D26A", fontSize: 12, fontWeight: 700 }}>
                            <CheckCircle size={13} />{t.approved}
                          </span>
                        ) : (
                          <button
                            disabled={approvingId === u.talentProfileId}
                            onClick={() => approve(u.talentProfileId)}
                            style={{
                              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
                              border: "none", backgroundColor: PRIMARY, color: "#fff",
                              fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: approvingId === u.talentProfileId ? 0.7 : 1,
                            }}
                          >
                            <CheckCircle size={13} />{approvingId === u.talentProfileId ? t.approving : t.approve}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={4} style={{ ...cellStyle, backgroundColor: TH }}>
                          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", fontSize: 12.5 }}>
                            <div>
                              <div style={{ color: MUTED, fontSize: 11, marginBottom: 2 }}>{t.account}</div>
                              <div style={{ fontWeight: 600 }}>{u.fullName ?? "—"} {u.handle && <span style={{ color: MUTED, fontWeight: 400 }}>· @{u.handle}</span>}</div>
                            </div>
                            <div>
                              <div style={{ color: MUTED, fontSize: 11, marginBottom: 2 }}>{t.email}</div>
                              {u.email ? (
                                <a href={`mailto:${u.email}`} style={{ color: PRIMARY, fontWeight: 600, textDecoration: "none" }}>{u.email}</a>
                              ) : (
                                <span style={{ color: MUTED }}>—</span>
                              )}
                            </div>
                            <div>
                              <div style={{ color: MUTED, fontSize: 11, marginBottom: 2 }}>{t.registeredAt}</div>
                              <div style={{ fontWeight: 600 }}>
                                {new Date(u.registeredAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}
                              </div>
                            </div>
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
