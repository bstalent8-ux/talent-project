"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Play, Eye, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useAdminPermissions } from "@/contexts/AdminPermissionsContext";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import { cdnImage } from "@/lib/images";
import type { AdminPendingMedia, PendingKind, PendingMediaStatus, PendingMediaType } from "@/features/admin/services/pending-media.service";

const STATUS_COLOR = { pending: "#E7A58A", approved: "#087F83", rejected: "#EF4444" } as const;

const TX = {
  ar: {
    pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض",
    approve: "اعتماد", reject: "رفض", takeDown: "سحب من البروفايل", reapprove: "اعتماد",
    selected: (n: number) => `${n} محدد`, approveSel: "اعتماد المحدد", rejectSel: "رفض المحدد", clear: "إلغاء التحديد",
    selectAll: "تحديد الكل في الصفحة",
    empty: { pending: "لا يوجد شيء بانتظار المراجعة 🎉", rejected: "لا توجد وسائط مرفوضة", approved: "لا توجد وسائط معتمدة", all: "لا توجد وسائط" },
    photo: "صورة", video: "فيديو", noCaption: "بدون تعليق", profilePhoto: "صورة بروفايل", current: "الحالية",
    profile: "البروفايل", uploaded: "اترفع", reason: "سبب الرفض",
    rejectTitle: "رفض الوسائط", rejectHint: "الموهبة هتشوف السبب ده وتقدر ترفع بديل.",
    rejectPlaceholder: "اكتب سبب الرفض...", cancel: "إلغاء", confirmReject: "تأكيد الرفض", confirmApprove: "تأكيد الاعتماد",
    approveTitle: "اعتماد الوسائط", approveText: (n: number) => `اعتماد ${n} ${n === 1 ? "ملف" : "ملفات"} وإظهارها على البروفايل العام؟`,
    preview: "معاينة", close: "إغلاق", openProfile: "فتح ملف الموهبة",
    quick: ["جودة ضعيفة", "محتوى غير مناسب", "مش صورة الموهبة / مش شغلها", "فيه بيانات تواصل أو علامة مائية"],
    err: "حصل خطأ، جرب تاني.", migration: "شغّل ملف الـSQL الخاص بالمراجعة أولاً (20260919_media_moderation.sql) عشان تقدر ترفض.",
    reasonRequired: "اكتب سبب الرفض (3 حروف على الأقل).",
    profilePending: "البروفايل لسه غير معتمد",
  },
  en: {
    pending: "Pending", approved: "Approved", rejected: "Rejected",
    approve: "Approve", reject: "Reject", takeDown: "Take down", reapprove: "Approve",
    selected: (n: number) => `${n} selected`, approveSel: "Approve selected", rejectSel: "Reject selected", clear: "Clear",
    selectAll: "Select all on page",
    empty: { pending: "Nothing waiting for review 🎉", rejected: "No rejected media", approved: "No approved media", all: "No media" },
    photo: "Photo", video: "Video", noCaption: "No caption", profilePhoto: "Profile photo", current: "Current",
    profile: "Profile", uploaded: "Uploaded", reason: "Rejection reason",
    rejectTitle: "Reject media", rejectHint: "The talent will see this reason and can upload a replacement.",
    rejectPlaceholder: "Why is this being rejected...", cancel: "Cancel", confirmReject: "Confirm reject", confirmApprove: "Confirm approve",
    approveTitle: "Approve media", approveText: (n: number) => `Approve ${n} ${n === 1 ? "file" : "files"} and show ${n === 1 ? "it" : "them"} on the public profile?`,
    preview: "Preview", close: "Close", openProfile: "Open talent profile",
    quick: ["Poor quality", "Inappropriate content", "Not the talent / not their work", "Contains contact info or a watermark"],
    err: "Something went wrong, try again.", migration: "Run the review migration first (20260919_media_moderation.sql) to enable rejecting.",
    reasonRequired: "Enter a rejection reason (3+ characters).",
    profilePending: "Profile isn't approved yet",
  },
};

function videoPoster(url: string): string | undefined {
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) return undefined;
  const [withoutQuery] = url.split("#")[0].split("?");
  const marker = "/video/upload/";
  const at = withoutQuery.indexOf(marker);
  if (at === -1) return undefined;
  const prefix = withoutQuery.slice(0, at + marker.length);
  const publicId = withoutQuery.slice(at + marker.length).replace(/\.[a-z0-9]+$/i, ".jpg");
  return `${prefix}so_0.5,f_jpg,q_auto,w_480/${publicId}`;
}

interface Props {
  kind:     PendingKind;
  items:    AdminPendingMedia[];
  total:    number;
  page:     number;
  pageSize: number;
  status:   PendingMediaStatus;
  type:     PendingMediaType;
  q:        string;
  migrated: boolean;
}

type Pending = { ids: string[]; action: "approve" | "reject" } | null;

export default function PendingMediaGrid({ kind, items, total, page, pageSize, status, type, q }: Props) {
  const isAvatar = kind === "avatar";
  const { dark, lang } = useSite();
  const t = TX[lang];
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canUpdate = permissions === null || !!permissions.pendingData?.canUpdate;

  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT = dark ? "#F5EEDB" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<AdminPendingMedia | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));

  function open(ids: string[], action: "approve" | "reject") { setError(""); setReason(""); setModal({ ids, action }); }

  async function submit() {
    if (!modal) return;
    if (modal.action === "reject" && reason.trim().length < 3) { setError(t.reasonRequired); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/pending-media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: modal.ids, action: modal.action, reason: reason.trim(), kind }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error === "migration_required" ? t.migration : t.err); setBusy(false); return; }
      setModal(null); setSelected(new Set()); setPreview(null); setBusy(false);
      router.refresh();
    } catch {
      setError(t.err); setBusy(false);
    }
  }

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (isAvatar) params.set("kind", "avatar");
    if (p > 1) params.set("page", String(p));
    if (status !== "pending") params.set("status", status);
    if (type !== "all") params.set("type", type);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/pending-data?${qs}` : "/admin/pending-data";
  };

  const btn = (label: string, color: string, onClick: () => void, filled = false) => (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: `1px solid ${color}`, backgroundColor: filled ? color : "transparent", color: filled ? "#0b0d13" : color, fontSize: 12.5, fontWeight: 700, cursor: "pointer", flex: 1 }}
    >
      {label}
    </button>
  );

  if (items.length === 0) return <EmptyState message={t.empty[status]} />;

  return (
    <>
      {canUpdate && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14, minHeight: 36 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 12.5, cursor: "pointer" }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 16, height: 16, accentColor: "#087F83" }} />
            {t.selectAll}
          </label>
          {selected.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "6px 10px", borderRadius: 10, backgroundColor: dark ? "#322722" : "#F1E8D2", border: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT, fontSize: 12.5, fontWeight: 700 }}>{t.selected(selected.size)}</span>
              {status !== "approved" && btn(t.approveSel, "#087F83", () => open([...selected], "approve"), true)}
              {status !== "rejected" && btn(t.rejectSel, "#EF4444", () => open([...selected], "reject"))}
              <button type="button" onClick={() => setSelected(new Set())} style={{ background: "none", border: "none", color: MUTED, fontSize: 12, cursor: "pointer" }}>{t.clear}</button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
        {items.map((it) => {
          const col = STATUS_COLOR[it.status];
          const isSel = selected.has(it.id);
          const video = it.mediaType === "video";
          const src = video ? videoPoster(it.url) : cdnImage(it.url, 520);
          return (
            <div key={it.id} style={{ backgroundColor: CARD, border: `1px solid ${isSel ? "#087F83" : BORDER}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setPreview(it)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPreview(it); } }}
                style={{ position: "relative", aspectRatio: isAvatar ? "1 / 1" : "4 / 3", cursor: "zoom-in", backgroundColor: dark ? "#322722" : "#ECE2CA", backgroundImage: src ? `url(${src})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
              >
                {video && (
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(27,19,16,0.6)", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Play size={18} color="#fff" fill="#fff" /></span>
                  </span>
                )}
                <span style={{ position: "absolute", top: 8, insetInlineEnd: 8, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 800, backgroundColor: `${col}dd`, color: "#111" }}>{t[it.status]}</span>
                <span style={{ position: "absolute", bottom: 8, insetInlineStart: 8, padding: "2px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 700, backgroundColor: "rgba(27,19,16,0.72)", color: "#fff" }}>{isAvatar ? t.profilePhoto : video ? t.video : t.photo}</span>
                {canUpdate && (
                  <input
                    type="checkbox"
                    checked={isSel}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggle(it.id)}
                    aria-label={t.selectAll}
                    style={{ position: "absolute", top: 8, insetInlineStart: 8, width: 18, height: 18, accentColor: "#087F83", cursor: "pointer" }}
                  />
                )}
              </div>

              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, backgroundColor: dark ? "#3A2E28" : "#E6DCC6", backgroundImage: it.talent.avatarUrl ? `url(${cdnImage(it.talent.avatarUrl, 64)})` : undefined, backgroundSize: "cover", color: MUTED, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {!it.talent.avatarUrl && it.talent.name.charAt(0).toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Link href={`/admin/talents/${it.talent.talentId}`} style={{ color: TEXT, fontSize: 13, fontWeight: 700, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.talent.name}</Link>
                    <span style={{ color: MUTED, fontSize: 11, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{it.talent.handle ?? "—"}{it.talent.category ? ` · ${it.talent.category}` : ""}</span>
                  </div>
                </div>

                {!isAvatar && <div style={{ color: it.caption ? TEXT : MUTED, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.caption ?? t.noCaption}</div>}
                <div style={{ color: MUTED, fontSize: 11 }}>{t.uploaded}: {new Date(it.createdAt).toLocaleString(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</div>

                {isAvatar && it.currentUrl && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 11 }}>
                    <span style={{ width: 26, height: 26, borderRadius: "50%", backgroundImage: `url(${cdnImage(it.currentUrl, 64)})`, backgroundSize: "cover", border: `1px solid ${BORDER}` }} />
                    {t.current}
                  </div>
                )}
                {it.talent.profileStatus && it.talent.profileStatus !== "approved" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#E7A58A", fontSize: 11 }}>
                    <AlertTriangle size={12} />{t.profilePending} ({it.talent.profileStatus})
                  </div>
                )}
                {it.status === "rejected" && it.rejectionReason && (
                  <div style={{ color: "#EF4444", fontSize: 11.5, lineHeight: 1.5 }}>{t.reason}: {it.rejectionReason}</div>
                )}

                {canUpdate && (
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 4 }}>
                    {it.status !== "approved" && btn(it.status === "rejected" ? t.reapprove : t.approve, "#087F83", () => open([it.id], "approve"), true)}
                    {it.status !== "rejected" && btn(it.status === "approved" ? t.takeDown : t.reject, "#EF4444", () => open([it.id], "reject"))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AdminPagination page={page} totalPages={totalPages} buildHref={hrefFor} />

      {/* Approve / reject confirmation */}
      {modal && (
        <div onClick={(e) => e.target === e.currentTarget && !busy && setModal(null)} style={{ position: "fixed", inset: 0, zIndex: 300, backgroundColor: "rgba(27,19,16,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div role="dialog" aria-modal="true" style={{ width: "100%", maxWidth: 460, backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
            <h3 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>{modal.action === "approve" ? t.approveTitle : t.rejectTitle}</h3>
            {modal.action === "approve" ? (
              <p style={{ color: MUTED, fontSize: 13.5, lineHeight: 1.7, margin: "0 0 16px" }}>{t.approveText(modal.ids.length)}</p>
            ) : (
              <>
                <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: "0 0 10px" }}>{t.rejectHint}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {t.quick.map((r) => (
                    <button key={r} type="button" onClick={() => { setReason(r); setError(""); }} style={{ padding: "4px 10px", borderRadius: 999, border: `1px solid ${BORDER}`, backgroundColor: reason === r ? (dark ? "#3A2E28" : "#F1E8D2") : "transparent", color: TEXT, fontSize: 11.5, cursor: "pointer" }}>{r}</button>
                  ))}
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setError(""); }}
                  placeholder={t.rejectPlaceholder}
                  rows={3}
                  maxLength={500}
                  style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 10, border: `1px solid ${BORDER}`, backgroundColor: dark ? "#261C18" : "#F1E8D2", color: TEXT, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", marginBottom: 12 }}
                />
              </>
            )}
            {error && <p role="alert" style={{ color: "#EF4444", fontSize: 12.5, margin: "0 0 12px" }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" disabled={busy} onClick={() => setModal(null)} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t.cancel}</button>
              <button type="button" disabled={busy} onClick={submit} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "none", backgroundColor: modal.action === "approve" ? "#087F83" : "#EF4444", color: "#fff", fontSize: 13, fontWeight: 800, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
                {busy ? <Loader2 size={14} className="spin" /> : modal.action === "approve" ? <Check size={14} /> : <X size={14} />}
                {modal.action === "approve" ? t.confirmApprove : t.confirmReject}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-size preview */}
      {preview && (
        <div onClick={(e) => e.target === e.currentTarget && setPreview(null)} style={{ position: "fixed", inset: 0, zIndex: 290, backgroundColor: "rgba(27,19,16,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 900, maxHeight: "92vh", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, color: "#fff" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{preview.talent.name} <span style={{ opacity: 0.6, fontWeight: 500, fontSize: 12.5 }}>@{preview.talent.handle ?? "—"}</span></div>
                {preview.caption && <div style={{ opacity: 0.8, fontSize: 12.5, marginTop: 2 }}>{preview.caption}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href={`/admin/talents/${preview.talent.talentId}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 12.5, textDecoration: "none" }}><ExternalLink size={13} />{t.openProfile}</Link>
                <button type="button" onClick={() => setPreview(null)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", backgroundColor: "transparent", color: "#fff", fontSize: 12.5, cursor: "pointer" }}>{t.close}</button>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, overflow: "hidden", backgroundColor: "#000" }}>
              {preview.mediaType === "video" ? (
                <video src={preview.url} controls autoPlay playsInline style={{ maxWidth: "100%", maxHeight: "72vh" }} />
              ) : (
                <img src={cdnImage(preview.url, 1400, "limit")} alt="" style={{ maxWidth: "100%", maxHeight: "72vh", objectFit: "contain" }} />
              )}
            </div>
            {canUpdate && (
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                {preview.status !== "approved" && <button type="button" onClick={() => open([preview.id], "approve")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, border: "none", backgroundColor: "#087F83", color: "#fff", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}><Check size={15} />{t.approve}</button>}
                {preview.status !== "rejected" && <button type="button" onClick={() => open([preview.id], "reject")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, border: "1px solid #EF4444", backgroundColor: "transparent", color: "#fca5a5", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}><X size={15} />{preview.status === "approved" ? t.takeDown : t.reject}</button>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
