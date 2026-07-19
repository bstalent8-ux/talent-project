"use client";
export const runtime = "edge";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Role = "talent" | "brand";
type Lang = "ar" | "en";
type Mode = "dark" | "light";

interface FormData {
  fullName:        string;
  email:           string;
  phone:           string;
  password:        string;
  confirmPassword: string;
  role:            Role;
  agreeToTerms:    boolean;
}

const INIT: FormData = {
  fullName:        "",
  email:           "",
  phone:           "",
  password:        "",
  confirmPassword: "",
  role:            "talent",
  agreeToTerms:    false,
};

const TX = {
  ar: {
    headline:        "أنت على بُعد 30 ثانية",
    sub:             "من أكبر سوق مواهب في العالم العربي",
    fullName:        "الاسم الكامل",
    fullNamePH:      "مثلاً: أحمد محمد",
    email:           "البريد الإلكتروني",
    emailPH:         "example@email.com",
    phone:           "رقم الهاتف",
    phonePH:         "+966 5xx xxx xxx",
    password:        "كلمة المرور",
    passwordPH:      "8 أحرف على الأقل",
    confirm:         "تأكيد كلمة المرور",
    confirmPH:       "أعد كتابة كلمة المرور",
    iAm:             "أنا...",
    talent:          "موهبة / منشئ محتوى",
    brand:           "براند / شركة",
    terms1:          "أوافق على",
    termsLink:       "الشروط والأحكام",
    terms2:          "و",
    privacyLink:     "سياسة الخصوصية",
    submit:          "إنشاء الحساب",
    loading:         "جاري الإنشاء...",
    haveAccount:     "لديك حساب؟",
    signIn:          "تسجيل الدخول",
    errRequired:     "الرجاء إكمال جميع الحقول",
    errEmail:        "البريد الإلكتروني غير صحيح",
    errPassShort:    "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    errPassMismatch: "كلمتا المرور غير متطابقتين",
    errTerms:        "يجب الموافقة على الشروط والأحكام",
    errPhone:        "الرجاء إدخال رقم هاتف صحيح",
  },
  en: {
    headline:        "You're 30 seconds away",
    sub:             "from the largest Arab talent marketplace",
    fullName:        "Full name",
    fullNamePH:      "e.g. Ahmed Mohamed",
    email:           "Email address",
    emailPH:         "example@email.com",
    phone:           "Phone number",
    phonePH:         "+966 5xx xxx xxx",
    password:        "Password",
    passwordPH:      "At least 8 characters",
    confirm:         "Confirm password",
    confirmPH:       "Re-enter your password",
    iAm:             "I am a...",
    talent:          "Talent / Creator",
    brand:           "Brand / Company",
    terms1:          "I agree to the",
    termsLink:       "Terms of Service",
    terms2:          "and",
    privacyLink:     "Privacy Policy",
    submit:          "Create account",
    loading:         "Creating...",
    haveAccount:     "Already have an account?",
    signIn:          "Sign in",
    errRequired:     "Please complete all required fields",
    errEmail:        "Please enter a valid email address",
    errPassShort:    "Password must be at least 8 characters",
    errPassMismatch: "Passwords do not match",
    errTerms:        "You must agree to the terms and conditions",
    errPhone:        "Please enter a valid phone number",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [form,      setForm]      = useState<FormData>(INIT);
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [error,     setError]     = useState("");
  const [lang,      setLang]      = useState<Lang>("ar");
  const [mode,      setMode]      = useState<Mode>("dark");

  const tx   = TX[lang];
  const dark = mode === "dark";
  const dir  = lang === "ar" ? "rtl" : "ltr";

  const BG     = dark ? "#060d18"  : "#f8fafc";
  const CARD   = dark ? "#0d1a2e"  : "#ffffff";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const INP    = dark ? "rgba(255,255,255,0.04)" : "#f8fafc";
  const TEXT   = dark ? "#f1f5f9"  : "#0f172a";
  const MUTED  = dark ? "#64748b"  : "#94a3b8";
  const TEAL   = "#00C9B1";

  const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validate = (): string => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.confirmPassword)
      return tx.errRequired;
    if (!form.email.includes("@") || !form.email.includes("."))
      return tx.errEmail;
    if (form.phone.replace(/\D/g, "").length < 9)
      return tx.errPhone;
    if (form.password.length < 8)
      return tx.errPassShort;
    if (form.password !== form.confirmPassword)
      return tx.errPassMismatch;
    if (!form.agreeToTerms)
      return tx.errTerms;
    return "";
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(""); setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpErr } = await supabase.auth.signUp({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        options:  { data: { role: form.role, full_name: form.fullName.trim() } },
      });

      if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }

      const uid = data.user?.id;
      if (!uid) { setError("Something went wrong. Please try again."); setLoading(false); return; }

      // Build minimal profile — everything else filled via profile completion
      const handle = form.email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-");

      await fetch("/api/profile", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          userId: uid,
          role:   form.role,
          profileData: {
            handle,
            full_name:    form.fullName.trim(),
            phone_number: form.phone.trim(),
          },
          ...(form.role === "talent" && {
            talentProfileData: {
              category:     "ugc",
              specialties:  [],
              social_links: {},
              packages:     [],
              availability: "available",
              profile_views: 0,
            },
          }),
        }),
      });

      router.push("/profile/me");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const passStrength = form.password.length === 0 ? 0 :
    form.password.length < 6 ? 1 :
    form.password.length < 8 ? 2 :
    form.password.match(/[A-Z]/) && form.password.match(/[0-9]/) ? 4 : 3;

  const strengthColor = ["transparent", "#ef4444", "#f59e0b", "#00C9B1", "#00D26A"][passStrength];

  const inputStyle: React.CSSProperties = {
    width:       "100%",
    padding:     "12px 16px",
    background:  INP,
    border:      `1px solid ${BORDER}`,
    borderRadius: 10,
    color:       TEXT,
    fontSize:    15,
    outline:     "none",
    boxSizing:   "border-box",
    fontFamily:  "'Cairo', sans-serif",
    transition:  "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display:     "block",
    color:       MUTED,
    fontSize:    13,
    marginBottom: 6,
    fontWeight:  500,
  };

  return (
    <div style={{
      minHeight:       "100vh",
      backgroundColor: BG,
      display:         "flex",
      flexDirection:   "column",
      alignItems:      "center",
      padding:         "32px 16px 48px",
      fontFamily:      "'Cairo', sans-serif",
      direction:       dir,
    }}>

      {/* Top bar */}
      <div style={{ width: "100%", maxWidth: 520, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <Image
          src={dark ? "/assets/logo-dark.png" : "/assets/logo-light.png"}
          alt="Talents"
          width={110}
          height={32}
          style={{ objectFit: "contain" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{
            background: INP, border: `1px solid ${BORDER}`, borderRadius: 6,
            padding: "4px 10px", cursor: "pointer", color: MUTED,
            fontSize: 12, fontWeight: 600, fontFamily: "'Cairo', sans-serif",
          }}>
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button onClick={() => setMode(dark ? "light" : "dark")} style={{
            background: INP, border: `1px solid ${BORDER}`, borderRadius: 6,
            padding: "4px 10px", cursor: "pointer", fontSize: 14,
          }}>
            {dark ? "☀️" : "🌙"}
          </button>
          <Link href="/login" style={{ color: MUTED, fontSize: 13, textDecoration: "none" }}>
            {tx.haveAccount}{" "}
            <span style={{ color: TEAL, fontWeight: 700 }}>{tx.signIn}</span>
          </Link>
        </div>
      </div>

      {/* Card */}
      <div style={{
        width:           "100%",
        maxWidth:        520,
        background:      CARD,
        border:          `1px solid ${BORDER}`,
        borderRadius:    20,
        padding:         "36px 40px",
      }}>

        {/* Headline */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <h1 style={{ color: TEXT, fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>{tx.headline}</h1>
          <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>{tx.sub}</p>
        </div>

        {/* User type toggle */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{tx.iAm}</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["talent", "brand"] as Role[]).map((r) => (
              <button key={r} onClick={() => set("role", r)} style={{
                flex:        1,
                padding:     "11px 0",
                background:  form.role === r ? TEAL : INP,
                color:       form.role === r ? "#fff" : MUTED,
                border:      `1px solid ${form.role === r ? TEAL : BORDER}`,
                borderRadius: 10,
                cursor:      "pointer",
                fontSize:    14,
                fontWeight:  600,
                fontFamily:  "'Cairo', sans-serif",
                transition:  "all 0.2s",
              }}>
                {r === "talent" ? tx.talent : tx.brand}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:   "rgba(239,68,68,0.08)",
            border:       "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            padding:      "10px 14px",
            color:        "#ef4444",
            fontSize:     13,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Full name */}
          <div>
            <label style={labelStyle}>{tx.fullName}</label>
            <input
              type="text"
              placeholder={tx.fullNamePH}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>{tx.email}</label>
            <input
              type="email"
              placeholder={tx.emailPH}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              dir="ltr"
              style={inputStyle}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>{tx.phone}</label>
            <input
              type="tel"
              placeholder={tx.phonePH}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              dir="ltr"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>{tx.password}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder={tx.passwordPH}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                dir="ltr"
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{
                  position:   "absolute",
                  right:      14,
                  top:        "50%",
                  transform:  "translateY(-50%)",
                  background: "none",
                  border:     "none",
                  cursor:     "pointer",
                  color:      MUTED,
                  fontSize:   14,
                  padding:    0,
                }}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
            {form.password.length > 0 && (
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    flex:        1,
                    height:      3,
                    borderRadius: 2,
                    background:  passStrength >= i ? strengthColor : BORDER,
                    transition:  "background 0.2s",
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label style={labelStyle}>{tx.confirm}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConf ? "text" : "password"}
                placeholder={tx.confirmPH}
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                dir="ltr"
                style={{
                  ...inputStyle,
                  paddingRight: 44,
                  borderColor:
                    form.confirmPassword && form.confirmPassword !== form.password
                      ? "#ef4444"
                      : form.confirmPassword && form.confirmPassword === form.password
                      ? "#00D26A"
                      : BORDER,
                }}
              />
              <button
                onClick={() => setShowConf(!showConf)}
                style={{
                  position:   "absolute",
                  right:      14,
                  top:        "50%",
                  transform:  "translateY(-50%)",
                  background: "none",
                  border:     "none",
                  cursor:     "pointer",
                  color:      MUTED,
                  fontSize:   14,
                  padding:    0,
                }}
              >
                {showConf ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Terms */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.agreeToTerms}
              onChange={(e) => set("agreeToTerms", e.target.checked)}
              style={{ marginTop: 3, flexShrink: 0, accentColor: TEAL, width: 16, height: 16, cursor: "pointer" }}
            />
            <span style={{ color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
              {tx.terms1}{" "}
              <Link href="/terms" style={{ color: TEAL, textDecoration: "none" }}>{tx.termsLink}</Link>
              {" "}{tx.terms2}{" "}
              <Link href="/privacy" style={{ color: TEAL, textDecoration: "none" }}>{tx.privacyLink}</Link>
            </span>
          </label>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width:        "100%",
              padding:      "14px 0",
              background:   loading ? (dark ? "rgba(255,255,255,0.06)" : "#e2e8f0") : TEAL,
              color:        loading ? MUTED : "#fff",
              border:       "none",
              borderRadius: 12,
              fontSize:     16,
              fontWeight:   700,
              fontFamily:   "'Cairo', sans-serif",
              cursor:       loading ? "wait" : "pointer",
              transition:   "opacity 0.2s",
              marginTop:    4,
            }}
          >
            {loading ? tx.loading : tx.submit}
          </button>
        </div>
      </div>

      <p style={{ color: MUTED, fontSize: 12, marginTop: 16, textAlign: "center" }}>
        {tx.haveAccount}{" "}
        <Link href="/login" style={{ color: TEAL, textDecoration: "none", fontWeight: 600 }}>
          {tx.signIn}
        </Link>
      </p>
    </div>
  );
}
