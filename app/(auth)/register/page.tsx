"use client";
export const runtime = "edge";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  talentType:      string;
  brandCategory:   string;
  agreeToTerms:    boolean;
}

const INIT: FormData = {
  fullName:        "",
  email:           "",
  phone:           "",
  password:        "",
  confirmPassword: "",
  role:            "talent",
  talentType:      "ugc",
  brandCategory:   "fashion",
  agreeToTerms:    false,
};

const TALENT_TYPES = [
  { value: "ugc", ar: "UGC Creator", en: "UGC Creator" },
  { value: "influencer", ar: "Influencer", en: "Influencer" },
  { value: "fashion", ar: "Fashion", en: "Fashion" },
  { value: "food_reviewer", ar: "Food Reviewer", en: "Food Reviewer" },
  { value: "media_buyers", ar: "Media Buyers", en: "Media Buyers" },
];

const BRAND_CATEGORIES = [
  { value: "fashion", ar: "Fashion", en: "Fashion" },
  { value: "food", ar: "Food", en: "Food" },
  { value: "tech", ar: "Tech", en: "Tech" },
];

const TX = {
  ar: {
    eyebrow:         "انضم الآن //",
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
    submit:          "إنشاء الحساب ←",
    loading:         "جاري الإنشاء...",
    haveAccount:     "لديك حساب؟",
    signIn:          "تسجيل الدخول",
    errRequired:     "الرجاء إكمال جميع الحقول",
    errEmail:        "البريد الإلكتروني غير صحيح",
    errPassShort:    "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    errPassMismatch: "كلمتا المرور غير متطابقتين",
    errTerms:        "يجب الموافقة على الشروط والأحكام",
    errPhone:        "الرجاء إدخال رقم هاتف صحيح",
    brand2:          "منصة المواهب",
    brandHighlight:  "العربية.",
    brandDesc:       "موديلز، UGC Creators، وإنفلونسرز — كلهم في مكان واحد. براندات موثقة. تعاون حقيقي.",
    stat1: "متوسط التقييم",
    stat2: "براند",
    stat3: "موهبة",
  },
  en: {
    eyebrow:         "JOIN NOW //",
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
    submit:          "Create account →",
    loading:         "Creating...",
    haveAccount:     "Already have an account?",
    signIn:          "Sign in",
    errRequired:     "Please complete all required fields",
    errEmail:        "Please enter a valid email address",
    errPassShort:    "Password must be at least 8 characters",
    errPassMismatch: "Passwords do not match",
    errTerms:        "You must agree to the terms and conditions",
    errPhone:        "Please enter a valid phone number",
    brand2:          "Arab Talent",
    brandHighlight:  "Platform.",
    brandDesc:       "Models, UGC Creators, and Influencers — all in one place. Verified brands. Real collaboration.",
    stat1: "Avg Rating",
    stat2: "Brands",
    stat3: "Talents",
  },
};

const floatingTalents = [
  { name: "سارة أحمد", sub: "Fashion · 8.4k", color: "#00C9B1" },
  { name: "عمر خالد",  sub: "UGC · 12k",      color: "#FFB800" },
  { name: "مي حسين",   sub: "Model · 5.2k",   color: "#FF6B2B" },
];

export default function RegisterPage() {
  const router   = useRouter();
  const isMobile = useIsMobile();

  const [form,     setForm]     = useState<FormData>(INIT);
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error,    setError]    = useState("");
  const [lang,     setLang]     = useState<Lang>("ar");
  const [mode,     setMode]     = useState<Mode>("dark");

  const tx   = TX[lang];
  const dark = mode === "dark";
  const dir  = lang === "ar" ? "rtl" : "ltr";

  const bg   = dark ? "#0a0a0a" : "#f5f5f0";
  const card = dark ? "#111111" : "#ffffff";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted= dark ? "#6b7280" : "#64748b";
  const inp  = dark ? "#1a1a1a" : "#f8fafc";
  const bord = dark ? "#2a2a2a" : "#e2e8f0";
  const gold = "#FFB800";

  const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validate = (): string => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.confirmPassword)
      return tx.errRequired;
    if (!form.email.includes("@") || !form.email.includes("."))
      return tx.errEmail;
    if (form.phone.replace(/\D/g, "").length < 9)
      return tx.errPhone;
    if (form.role === "talent" && !form.talentType)
      return lang === "ar" ? "اختار نوع الموهبة" : "Please choose a talent type";
    if (form.role === "brand" && !form.brandCategory)
      return lang === "ar" ? "اختار تصنيف البراند" : "Please choose a brand category";
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
            ...(form.role === "brand" && { brand_category: form.brandCategory }),
          },
          ...(form.role === "talent" && {
            talentProfileData: {
              category:     form.talentType,
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

  const strengthColor = ["transparent", "#ef4444", "#f59e0b", gold, "#00D26A"][passStrength];

  const inputStyle: React.CSSProperties = {
    width:        "100%",
    padding:      "11px 14px",
    background:   inp,
    border:       `1px solid ${bord}`,
    borderRadius: 8,
    color:        text,
    fontSize:     14,
    outline:      "none",
    boxSizing:    "border-box",
    fontFamily:   "'Cairo', sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display:      "block",
    color:        muted,
    fontSize:     13,
    marginBottom: 6,
    fontWeight:   500,
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "row",
      backgroundColor: bg, fontFamily: "'Cairo', sans-serif", direction: dir,
    }}>

      {/* ── FORM SIDE ── */}
      <div style={{
        width:           isMobile ? "100%" : "48%",
        minWidth:        isMobile ? "unset" : "400px",
        display:         "flex",
        flexDirection:   "column",
        justifyContent:  "center",
        padding:         isMobile ? "32px 24px" : "40px 52px",
        position:        "relative",
        backgroundColor: card,
        overflowY:       "auto",
      }}>

        {/* Controls top */}
        <div style={{
          position: "absolute", top: "24px",
          [lang === "ar" ? "right" : "left"]: "24px",
          display: "flex", gap: "8px", alignItems: "center",
        }}>
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{
            background: inp, border: "none", borderRadius: "6px",
            padding: "4px 10px", cursor: "pointer",
            color: muted, fontSize: "12px", fontWeight: 600, fontFamily: "'Cairo', sans-serif",
          }}>
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button onClick={() => setMode(dark ? "light" : "dark")} style={{
            background: inp, border: "none", borderRadius: "6px",
            padding: "4px 10px", cursor: "pointer", fontSize: "13px",
          }}>
            {dark ? "☀️" : "🌙"}
          </button>
          <Link href="/login" style={{ color: muted, fontSize: 13, textDecoration: "none", marginInlineStart: 4 }}>
            {tx.haveAccount}{" "}
            <span style={{ color: gold, fontWeight: 700 }}>{tx.signIn}</span>
          </Link>
        </div>

        {/* Heading */}
        <p style={{ color: gold, fontSize: "11px", fontWeight: 700, letterSpacing: "3px", marginBottom: "8px" }}>
          {tx.eyebrow}
        </p>
        <h1 style={{ color: text, fontSize: "28px", fontWeight: 800, margin: "0 0 6px" }}>
          {tx.headline}
        </h1>
        <p style={{ color: muted, fontSize: "14px", marginBottom: "28px" }}>
          {tx.sub}
        </p>

        {/* Role toggle */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{tx.iAm}</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["talent", "brand"] as Role[]).map((r) => (
              <button key={r} onClick={() => set("role", r)} style={{
                flex:         1,
                padding:      "10px 0",
                background:   form.role === r ? gold : inp,
                color:        form.role === r ? "#000" : muted,
                border:       `1px solid ${form.role === r ? gold : bord}`,
                borderRadius: 8,
                cursor:       "pointer",
                fontSize:     13,
                fontWeight:   700,
                fontFamily:   "'Cairo', sans-serif",
                transition:   "all 0.15s",
              }}>
                {r === "talent" ? tx.talent : tx.brand}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>
            {form.role === "talent"
              ? (lang === "ar" ? "نوع الموهبة" : "Talent type")
              : (lang === "ar" ? "تصنيف البراند" : "Brand category")}
          </label>
          <select
            value={form.role === "talent" ? form.talentType : form.brandCategory}
            onChange={(event) => {
              if (form.role === "talent") set("talentType", event.target.value);
              else set("brandCategory", event.target.value);
            }}
            style={{
              ...inputStyle,
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `linear-gradient(45deg, transparent 50%, ${muted} 50%), linear-gradient(135deg, ${muted} 50%, transparent 50%)`,
              backgroundPosition: lang === "ar" ? "16px 50%, 10px 50%" : "calc(100% - 16px) 50%, calc(100% - 10px) 50%",
              backgroundSize: "6px 6px, 6px 6px",
              backgroundRepeat: "no-repeat",
            }}
          >
            {(form.role === "talent" ? TALENT_TYPES : BRAND_CATEGORIES).map((item) => (
              <option key={item.value} value={item.value}>
                {lang === "ar" ? item.ar : item.en}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:   "rgba(239,68,68,0.08)",
            border:       "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "10px 14px",
            color: "#ef4444", fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div>
            <label style={labelStyle}>{tx.fullName}</label>
            <input type="text" placeholder={tx.fullNamePH} value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{tx.email}</label>
            <input type="email" placeholder={tx.emailPH} value={form.email}
              onChange={(e) => set("email", e.target.value)} dir="ltr" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{tx.phone}</label>
            <input type="tel" placeholder={tx.phonePH} value={form.phone}
              onChange={(e) => set("phone", e.target.value)} dir="ltr" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{tx.password}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"} placeholder={tx.passwordPH}
                value={form.password} onChange={(e) => set("password", e.target.value)}
                dir="ltr" style={{ ...inputStyle, paddingRight: 42 }}
              />
              <button onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 14, padding: 0,
              }}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
            {form.password.length > 0 && (
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: passStrength >= i ? strengthColor : bord,
                    transition: "background 0.2s",
                  }} />
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>{tx.confirm}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConf ? "text" : "password"} placeholder={tx.confirmPH}
                value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)}
                dir="ltr"
                style={{
                  ...inputStyle,
                  paddingRight: 42,
                  borderColor:
                    form.confirmPassword && form.confirmPassword !== form.password ? "#ef4444" :
                    form.confirmPassword && form.confirmPassword === form.password  ? "#00D26A" :
                    bord,
                }}
              />
              <button onClick={() => setShowConf(!showConf)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 14, padding: 0,
              }}>
                {showConf ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Terms */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox" checked={form.agreeToTerms}
              onChange={(e) => set("agreeToTerms", e.target.checked)}
              style={{ marginTop: 3, flexShrink: 0, accentColor: gold, width: 16, height: 16, cursor: "pointer" }}
            />
            <span style={{ color: muted, fontSize: 13, lineHeight: 1.6 }}>
              {tx.terms1}{" "}
              <Link href="/terms" style={{ color: gold, textDecoration: "none" }}>{tx.termsLink}</Link>
              {" "}{tx.terms2}{" "}
              <Link href="/privacy" style={{ color: gold, textDecoration: "none" }}>{tx.privacyLink}</Link>
            </span>
          </label>

          {/* Submit */}
          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              width: "100%", padding: "14px 0",
              backgroundColor: gold, color: "#000",
              border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 800,
              fontFamily: "'Cairo', sans-serif",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {loading ? tx.loading : tx.submit}
          </button>
        </div>

        <p style={{ textAlign: "center", color: muted, fontSize: "13px", margin: "16px 0 0" }}>
          {tx.haveAccount}{" "}
          <Link href="/login" style={{ color: gold, fontWeight: 700, textDecoration: "none" }}>
            {tx.signIn}
          </Link>
        </p>
      </div>

      {/* ── BRANDING SIDE — desktop only ── */}
      {!isMobile && (
        <div style={{
          flex: 1, position: "relative", overflow: "hidden",
          backgroundColor: "#0a0a0a",
          backgroundImage: "radial-gradient(ellipse at 30% 60%, rgba(255,184,0,0.08) 0%, transparent 60%)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "32px 48px",
        }}>
          <div style={{ textAlign: lang === "ar" ? "right" : "left" }}>
            <Image src="/assets/logo.png" alt="Talents" width={110} height={32}
              style={{ height: "32px", width: "auto" }} />
          </div>

          {/* Floating cards */}
          <div style={{
            position: "absolute", left: "48px", top: "50%",
            transform: "translateY(-60%)",
            display: "flex", flexDirection: "column", gap: "12px",
          }}>
            {floatingTalents.map((tl, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "10px",
                backgroundColor: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px", padding: "10px 14px",
              }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  backgroundColor: tl.color + "33",
                  border: `2px solid ${tl.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 700, color: tl.color,
                }}>
                  {tl.name[0]}
                </div>
                <div>
                  <p style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: 700, margin: 0 }}>{tl.name}</p>
                  <p style={{ color: "#6b7280", fontSize: "11px", margin: 0 }}>{tl.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Headline */}
          <div style={{ textAlign: lang === "ar" ? "right" : "left" }}>
            <h2 style={{ color: "#f1f5f9", fontSize: "52px", fontWeight: 900, lineHeight: 1.15, margin: "0 0 16px" }}>
              {tx.brand2}<br />
              <span style={{ color: gold, fontStyle: "italic" }}>{tx.brandHighlight}</span>
            </h2>
            <p style={{ color: "#6b7280", fontSize: "15px", lineHeight: 1.7, maxWidth: "320px", margin: lang === "ar" ? "0 0 0 auto" : "0 auto 0 0" }}>
              {tx.brandDesc}
            </p>
            <div style={{ display: "flex", gap: "40px", marginTop: "40px", justifyContent: lang === "ar" ? "flex-end" : "flex-start" }}>
              {[
                { val: "4.9",  label: tx.stat1 },
                { val: "83",   label: tx.stat2 },
                { val: "+247", label: tx.stat3 },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: lang === "ar" ? "right" : "left" }}>
                  <p style={{ color: gold, fontSize: "22px", fontWeight: 900, margin: 0 }}>{s.val}</p>
                  <p style={{ color: "#6b7280", fontSize: "12px", margin: "2px 0 0" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
