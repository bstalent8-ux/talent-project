"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SectionProps } from "./SettingsClient";

const TX = {
  ar: {
    title: "الحساب",
    fullName: "الاسم الكامل", email: "البريد الإلكتروني", phone: "رقم الهاتف",
    editInProfile: "التعديل من قسم الملف الشخصي",
    notProvided: "غير مسجل",
    changePassword: "تغيير كلمة المرور",
    newPassword: "كلمة المرور الجديدة", confirmPassword: "تأكيد كلمة المرور",
    savePassword: "حفظ كلمة المرور", saving: "جاري الحفظ...",
    passwordTooShort: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordSaved: "تم تغيير كلمة المرور ✓",
    changeEmail: "تغيير البريد الإلكتروني",
    newEmail: "البريد الإلكتروني الجديد",
    saveEmail: "حفظ البريد الإلكتروني",
    emailInvalid: "أدخل بريدًا إلكترونيًا صحيحًا.",
    emailSaved: "تم إرسال رابط تأكيد إلى بريدك الجديد. راجع صندوق الوارد لتأكيد التغيير.",
    genericError: "حدث خطأ، حاول مرة أخرى.",
  },
  en: {
    title: "Account",
    fullName: "Full Name", email: "Email Address", phone: "Phone Number",
    editInProfile: "Edit from the Profile section",
    notProvided: "Not set",
    changePassword: "Change Password",
    newPassword: "New Password", confirmPassword: "Confirm Password",
    savePassword: "Save Password", saving: "Saving...",
    passwordTooShort: "Password must be at least 8 characters.",
    passwordMismatch: "Passwords do not match.",
    passwordSaved: "Password changed ✓",
    changeEmail: "Change Email",
    newEmail: "New Email Address",
    saveEmail: "Save Email",
    emailInvalid: "Enter a valid email address.",
    emailSaved: "A confirmation link was sent to your new email. Check your inbox to confirm the change.",
    genericError: "Something went wrong, please try again.",
  },
};

export default function AccountSection({ profile, email, lang, dark }: SectionProps) {
  const t = TX[lang];
  const TEXT  = dark ? "#F5EEDB" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const BORDER = dark ? "rgba(79,167,163,0.15)" : "#E6DCC3";
  const INP   = dark ? "#231A16" : "#F6F0DD";
  const GREEN = "var(--color-primary-text)";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function savePassword() {
    setPwMsg(null);
    if (newPassword.length < 8) { setPwMsg({ type: "err", text: t.passwordTooShort }); return; }
    if (newPassword !== confirmPassword) { setPwMsg({ type: "err", text: t.passwordMismatch }); return; }
    setPwSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) { setPwMsg({ type: "err", text: error.message || t.genericError }); return; }
    setPwMsg({ type: "ok", text: t.passwordSaved });
    setNewPassword(""); setConfirmPassword("");
  }

  async function saveEmail() {
    setEmailMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) { setEmailMsg({ type: "err", text: t.emailInvalid }); return; }
    setEmailSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);
    if (error) { setEmailMsg({ type: "err", text: error.message || t.genericError }); return; }
    setEmailMsg({ type: "ok", text: t.emailSaved });
    setNewEmail("");
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", backgroundColor: INP, border: `1px solid ${BORDER}`,
    borderRadius: 8, color: TEXT, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  };

  const row = (label: string, value: string | null) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ color: MUTED, fontSize: 13 }}>{label}</span>
      <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{value || t.notProvided}</span>
    </div>
  );

  return (
    <div>
      <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 16px" }}>{t.title}</h2>

      <div style={{ marginBottom: 24 }}>
        {row(t.fullName, profile.full_name)}
        {row(t.email, email)}
        {row(t.phone, profile.phone_number)}
        <p style={{ color: MUTED, fontSize: 11.5, margin: "8px 0 0" }}>{t.editInProfile}</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{t.changePassword}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t.newPassword} style={inp} />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t.confirmPassword} style={inp} />
          {pwMsg && <p style={{ color: pwMsg.type === "ok" ? GREEN : "#EF4444", fontSize: 12.5, margin: 0 }}>{pwMsg.text}</p>}
          <button
            onClick={savePassword}
            disabled={pwSaving || !newPassword || !confirmPassword}
            style={{ alignSelf: "flex-start", padding: "9px 18px", backgroundColor: "var(--color-primary)", border: "none", borderRadius: 8, color: "var(--color-primary-ink)", fontSize: 13, fontWeight: 800, cursor: pwSaving ? "wait" : "pointer", opacity: (!newPassword || !confirmPassword) ? 0.5 : 1 }}
          >
            {pwSaving ? t.saving : t.savePassword}
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{t.changeEmail}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={t.newEmail} style={{ ...inp, direction: "ltr" }} />
          {emailMsg && <p style={{ color: emailMsg.type === "ok" ? GREEN : "#EF4444", fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>{emailMsg.text}</p>}
          <button
            onClick={saveEmail}
            disabled={emailSaving || !newEmail}
            style={{ alignSelf: "flex-start", padding: "9px 18px", backgroundColor: "transparent", border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 13, fontWeight: 700, cursor: emailSaving ? "wait" : "pointer", opacity: !newEmail ? 0.5 : 1 }}
          >
            {emailSaving ? t.saving : t.saveEmail}
          </button>
        </div>
      </div>
    </div>
  );
}
