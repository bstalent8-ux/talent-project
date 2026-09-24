"use client";
// ─── Admin-filed complaint about a talent ───────────────────────────────────
// One icon + modal, used both from TalentsTable (per row) and
// TalentEditorClient (identity header) — name/phone/email pre-fill from the
// talent's own record (still editable) so the admin only has to type the
// complaint itself. Posts to /api/admin/talents/[id]/support-ticket, which
// files it in the same inbox /admin/support already shows and pings every
// admin so whoever's on support triage sees it.

import { useRef, useState } from "react";
import { AlertTriangle, Image as ImageIcon, X } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

const TX = {
  ar: {
    trigger:  "رفع شكوى على الموهبة",
    heading:  "شكوى على الموهبة",
    sub:      "التفاصيل هتتحفظ في تذاكر الدعم وهيوصل إشعار لكل الأدمن.",
    name:     "الاسم", email: "البريد الإلكتروني", phone: "رقم الهاتف",
    message:  "شرح الشكوى", messagePH: "اكتب تفاصيل المشكلة...",
    attachment: "صورة أو فيديو (اختياري)", attachBtn: "إرفاق صورة أو فيديو", removeAttach: "إزالة",
    submit:   "إرسال الشكوى", sending: "جاري الإرسال...",
    errRequired: "لازم تكتب تفاصيل الشكوى.",
    errFileType: "الملف لازم يكون صورة أو فيديو.",
    errFileSize: "الملف أكبر من الحجم المسموح.",
    errServer:   "حصل خطأ، حاول تاني.",
    successTitle: "تم الإرسال ✓", successSub: "التذكرة اتحفظت في تذاكر الدعم.",
    close: "إغلاق", cancel: "إلغاء",
  },
  en: {
    trigger:  "File a complaint",
    heading:  "Complaint about this talent",
    sub:      "This will be saved as a support ticket and every admin gets notified.",
    name:     "Name", email: "Email", phone: "Phone",
    message:  "Complaint details", messagePH: "Describe what happened...",
    attachment: "Photo or video (optional)", attachBtn: "Attach a photo or video", removeAttach: "Remove",
    submit:   "Send complaint", sending: "Sending...",
    errRequired: "Complaint details are required.",
    errFileType: "The file must be an image or video.",
    errFileSize: "The file is larger than the allowed size.",
    errServer:   "Something went wrong, try again.",
    successTitle: "Sent ✓", successSub: "The ticket was saved to Support Tickets.",
    close: "Close", cancel: "Cancel",
  },
};

interface Props {
  talentProfileId: string;
  fullName: string | null;
  phone:    string | null;
  email:    string | null;
  size?: number;
}

export default function TalentComplaintButton({ talentProfileId, fullName, phone, email, size = 16 }: Props) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(fullName ?? "");
  const [emailVal, setEmailVal] = useState(email ?? "");
  const [phoneVal, setPhoneVal] = useState(phone ?? "");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const CARD   = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";
  const TEXT   = dark ? "#F5EEDB" : "#2B211D";
  const MUTED  = dark ? "#A99B8E" : "#6E5F55";
  const INPUT  = dark ? "#261C18" : "#F1E8D2";

  function reset() {
    setOpen(false);
    setMessage(""); setError(""); setSent(false);
    clearFile();
  }

  function openModal(e?: React.MouseEvent) {
    e?.stopPropagation();
    setName(fullName ?? ""); setEmailVal(email ?? ""); setPhoneVal(phone ?? "");
    setOpen(true);
  }

  function clearFile() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if (!isVideo && !isImage) { setError(t.errFileType); return; }
    if (f.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) { setError(t.errFileSize); return; }
    setError("");
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!message.trim()) { setError(t.errRequired); return; }
    setSending(true); setError("");
    try {
      const body = new FormData();
      body.append("name", name.trim());
      body.append("email", emailVal.trim());
      body.append("phone", phoneVal.trim());
      body.append("message", message.trim());
      if (file) body.append("file", file);

      const res = await fetch(`/api/admin/talents/${talentProfileId}/support-ticket`, { method: "POST", body });
      if (!res.ok) { setError(t.errServer); setSending(false); return; }
      setSent(true);
    } catch {
      setError(t.errServer);
    } finally {
      setSending(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%", borderRadius: 8, border: `1px solid ${BORDER}`,
    backgroundColor: INPUT, color: TEXT, padding: "8px 10px", fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = { color: MUTED, fontSize: 12, display: "block", marginBottom: 5 };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        title={t.trigger}
        aria-label={t.trigger}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 4, borderRadius: 6, display: "flex" }}
      >
        <AlertTriangle size={size} />
      </button>

      {open && (
        <div
          onClick={(e) => { e.stopPropagation(); reset(); }}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: "min(480px, 100%)", maxHeight: "88vh", overflowY: "auto", padding: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <h2 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0 }}>{t.heading}</h2>
              <button onClick={reset} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: "0 0 6px" }}>{t.successTitle}</p>
                <p style={{ color: MUTED, fontSize: 13, margin: "0 0 18px" }}>{t.successSub}</p>
                <button
                  onClick={reset}
                  style={{ padding: "8px 20px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  {t.close}
                </button>
              </div>
            ) : (
              <>
                <p style={{ color: MUTED, fontSize: 12.5, margin: "0 0 16px" }}>{t.sub}</p>

                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 140px" }}>
                    <label style={labelStyle}>{t.name}</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <label style={labelStyle}>{t.phone}</label>
                    <input value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} style={{ ...fieldStyle, direction: "ltr" }} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>{t.email}</label>
                  <input value={emailVal} onChange={(e) => setEmailVal(e.target.value)} style={{ ...fieldStyle, direction: "ltr" }} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>{t.message}</label>
                  <textarea
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); setError(""); }}
                    rows={4}
                    placeholder={t.messagePH}
                    style={{ ...fieldStyle, resize: "vertical" }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>{t.attachment}</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />
                  {preview ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {file?.type.startsWith("video/") ? (
                        <video src={preview} muted style={{ width: 90, height: 60, borderRadius: 8, objectFit: "cover", border: `1px solid ${BORDER}` }} />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt="" style={{ width: 90, height: 60, borderRadius: 8, objectFit: "cover", border: `1px solid ${BORDER}` }} />
                      )}
                      <button type="button" onClick={clearFile} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", color: MUTED, fontSize: 12, cursor: "pointer" }}>
                        {t.removeAttach}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px dashed ${BORDER}`, borderRadius: 8, padding: "8px 12px", color: MUTED, fontSize: 12.5, cursor: "pointer" }}
                    >
                      <ImageIcon size={14} />
                      {t.attachBtn}
                    </button>
                  )}
                </div>

                {error && <p style={{ color: "#EF4444", fontSize: 12.5, margin: "0 0 10px" }} role="alert">{error}</p>}

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={sending}
                    style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13, cursor: "pointer" }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={sending}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "#EF4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: sending ? 0.7 : 1 }}
                  >
                    {sending ? t.sending : t.submit}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
