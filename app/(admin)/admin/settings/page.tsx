"use client";
import { useEffect, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useSite } from "@/contexts/SiteContext";
import { Camera, Save, User } from "lucide-react";

const TX = {
  ar: {
    title: "الإعدادات",
    profile: "الملف الشخصي",
    fullName: "الاسم الكامل",
    handle: "اسم المستخدم",
    city: "المدينة",
    bio: "نبذة",
    email: "البريد الإلكتروني",
    changePhoto: "تغيير الصورة",
    save: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    saved: "تم الحفظ ✓",
    errLoad: "فشل تحميل البيانات",
    errSave: "فشل الحفظ",
    uploading: "جاري رفع الصورة...",
    emailNote: "لا يمكن تغيير البريد الإلكتروني من هنا",
  },
  en: {
    title: "Settings",
    profile: "Profile",
    fullName: "Full Name",
    handle: "Username",
    city: "City",
    bio: "Bio",
    email: "Email",
    changePhoto: "Change Photo",
    save: "Save Changes",
    saving: "Saving...",
    saved: "Saved ✓",
    errLoad: "Failed to load profile",
    errSave: "Failed to save",
    uploading: "Uploading photo...",
    emailNote: "Email cannot be changed here",
  },
};

interface ProfileData {
  full_name: string;
  handle: string;
  city: string;
  bio: string;
  avatar_url: string;
  email: string;
}

export default function AdminSettingsPage() {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileData>({
    full_name: "", handle: "", city: "", bio: "", avatar_url: "", email: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "uploading" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const INPUT  = dark ? "#0a121c" : "#f8fafc";
  const GREEN  = "#00D26A";

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.json())
      .then(({ profile, email }) => {
        if (profile) {
          setForm({
            full_name:  profile.full_name  ?? "",
            handle:     profile.handle     ?? "",
            city:       profile.city       ?? "",
            bio:        profile.bio        ?? "",
            avatar_url: profile.avatar_url ?? "",
            email:      email              ?? "",
          });
          setLoaded(true);
        }
      });
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setErrMsg("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-avatar", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed");
      // Add cache-buster so browser shows the new image immediately
      setForm(f => ({ ...f, avatar_url: json.url + "?t=" + Date.now() }));
      setStatus("idle");
    } catch (err: unknown) {
      setStatus("error");
      setErrMsg(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleSave() {
    setStatus("saving");
    setErrMsg("");
    try {
      const res = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:  form.full_name  || null,
          handle:     form.handle     || null,
          city:       form.city       || null,
          bio:        form.bio        || null,
          // strip cache-buster before saving
          avatar_url: form.avatar_url ? form.avatar_url.split("?")[0] : null,
        }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? t.errSave);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err: unknown) {
      setStatus("error");
      setErrMsg(err instanceof Error ? err.message : t.errSave);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: `1px solid ${BORDER}`, backgroundColor: INPUT,
    color: TEXT, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", color: MUTED, fontSize: 12, fontWeight: 600,
    marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
  };

  const field = (
    key: keyof Omit<ProfileData, "email" | "avatar_url">,
    label: string,
    multiline = false,
  ) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {multiline ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
          dir={ar ? "rtl" : "ltr"}
        />
      ) : (
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={inputStyle}
          dir={ar ? "rtl" : "ltr"}
        />
      )}
    </div>
  );

  if (!loaded) {
    return (
      <AdminShell title={t.title}>
        <div style={{ color: MUTED, fontSize: 14, padding: "60px 0", textAlign: "center" }}>
          {ar ? "جاري التحميل..." : "Loading..."}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={t.title}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{
          backgroundColor: CARD, border: `1px solid ${BORDER}`,
          borderRadius: 20, overflow: "hidden",
        }}>
          {/* Header bar */}
          <div style={{
            padding: "20px 28px", borderBottom: `1px solid ${BORDER}`,
            fontWeight: 700, fontSize: 16, color: TEXT,
          }}>
            {t.profile}
          </div>

          <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  backgroundColor: BORDER, overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${GREEN}`,
                }}>
                  {form.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <User size={36} color={MUTED} />
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={status === "uploading"}
                  style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 28, height: 28, borderRadius: "50%",
                    backgroundColor: GREEN, border: "2px solid " + CARD,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Camera size={13} color="#fff" />
                </button>
              </div>
              <div>
                <div style={{ color: TEXT, fontWeight: 600, fontSize: 15 }}>
                  {form.full_name || (ar ? "بدون اسم" : "No name")}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={status === "uploading"}
                  style={{
                    marginTop: 6, background: "none", border: `1px solid ${BORDER}`,
                    borderRadius: 8, padding: "5px 14px", color: MUTED,
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {status === "uploading" ? t.uploading : t.changePhoto}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
              </div>
            </div>

            {/* Fields */}
            {field("full_name", t.fullName)}
            {field("handle", t.handle)}
            {field("city", t.city)}
            {field("bio", t.bio, true)}

            {/* Email (read-only) */}
            <div>
              <label style={labelStyle}>{t.email}</label>
              <input
                value={form.email}
                readOnly
                style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
              />
              <span style={{ color: MUTED, fontSize: 11, marginTop: 4, display: "block" }}>
                {t.emailNote}
              </span>
            </div>

            {/* Error */}
            {status === "error" && (
              <div style={{
                backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 13,
              }}>
                {errMsg || t.errSave}
              </div>
            )}

            {/* Save button */}
            <div style={{ display: "flex", justifyContent: ar ? "flex-start" : "flex-end" }}>
              <button
                onClick={handleSave}
                disabled={status === "saving" || status === "uploading"}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 28px", borderRadius: 12, border: "none",
                  backgroundColor: status === "saved" ? "#16a34a" : GREEN,
                  color: "#fff", fontWeight: 700, fontSize: 14,
                  cursor: status === "saving" ? "wait" : "pointer",
                  fontFamily: "inherit", transition: "background 0.2s",
                }}
              >
                <Save size={16} />
                {status === "saving" ? t.saving : status === "saved" ? t.saved : t.save}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
