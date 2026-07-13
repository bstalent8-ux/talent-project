"use client";
export const runtime = 'edge';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";

type Lang = "ar" | "en";
type Mode = "dark" | "light";

const tx = {
  ar: {
    eyebrow:    "WELCOME BACK //",
    heading:    "أهلاً بيك من جديد",
    sub:        "سجل دخولك وكمّل من حيث وقفت",
    email:      "البريد الإلكتروني",
    emailPH:    "example@email.com",
    password:   "كلمة المرور",
    passwordPH: "كلمة المرور",
    forgot:     "نسيت كلمة المرور؟",
    loginBtn:   "دخول ←",
    noAccount:  "ما عندكش حساب؟",
    register:   "سجّل مجاناً",
    loading:    "جاري...",
    error:      "الإيميل أو كلمة المرور غلط",
    brand:          "منصة المواهب",
    brandHighlight: "العربية.",
    brandDesc:      "موديلز، UGC Creators، وإنفلونسرز — كلهم في مكان واحد. براندات موثقة. تعاون حقيقي.",
    stat1: "متوسط التقييم",
    stat2: "براند",
    stat3: "موهبة",
  },
  en: {
    eyebrow:    "WELCOME BACK //",
    heading:    "Welcome Back",
    sub:        "Sign in and continue where you left off",
    email:      "Email",
    emailPH:    "example@email.com",
    password:   "Password",
    passwordPH: "Your password",
    forgot:     "Forgot password?",
    loginBtn:   "Sign In →",
    noAccount:  "Don't have an account?",
    register:   "Sign up free",
    loading:    "Loading...",
    error:      "Wrong email or password",
    brand:          "Arab Talent",
    brandHighlight: "Platform.",
    brandDesc:      "Models, UGC Creators, and Influencers — all in one place. Verified brands. Real collaboration.",
    stat1: "Avg Rating",
    stat2: "Brands",
    stat3: "Talents",
  },
};

const floatingTalents = [
  { name: "سارة أحمد", sub: "Fashion · 8.4k", color: "#00C9B1" },
  { name: "عمر خالد",  sub: "UGC · 12k",      color: "#FFB800" },
  { name: "مي حسين",   sub: "Model · 5.2k",   color: "#8B2FC9" },
];

export default function LoginPage() {
  const router    = useRouter();
  const supabase  = createClient();
  const isMobile  = useIsMobile();

  const [lang,     setLang]     = useState<Lang>("ar");
  const [mode,     setMode]     = useState<Mode>("dark");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const t   = tx[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const dark = mode === "dark";

  const bg    = dark ? "#0a0a0a" : "#f5f5f0";
  const card  = dark ? "#111111" : "#ffffff";
  const text  = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#6b7280" : "#64748b";
  const inp   = dark ? "#1a1a1a" : "#f8fafc";
  const bord  = dark ? "#2a2a2a" : "#e2e8f0";
  const gold  = "#FFB800";

  async function handleLogin() {
    if (!email || !password) { setError(t.error); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(t.error); return; }

    const res = await fetch("/api/me/role");
    const { role } = await res.json();
    console.log("User role:", role);
    if (role === "admin") {
      router.push("/admin");
    } else {
      router.push("/explore");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "row",
      backgroundColor: bg, fontFamily: "'Cairo', sans-serif", direction: dir,
    }}>

      {/* ── FORM SIDE ── */}
      <div style={{
        width: isMobile ? "100%" : "42%",
        minWidth: isMobile ? "unset" : "380px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: isMobile ? "32px 24px" : "48px 56px", position: "relative",
        backgroundColor: card,
      }}>

        {/* Controls top */}
        <div style={{
          position: "absolute", top: "24px",
          [lang === "ar" ? "right" : "left"]: "24px",
          display: "flex", gap: "8px",
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
        </div>

        {/* Heading */}
        <p style={{ color: gold, fontSize: "11px", fontWeight: 700, letterSpacing: "3px", marginBottom: "8px" }}>
          {t.eyebrow}
        </p>
        <h1 style={{ color: text, fontSize: "32px", fontWeight: 800, margin: "0 0 6px" }}>
          {t.heading}
        </h1>
        <p style={{ color: muted, fontSize: "14px", marginBottom: "36px" }}>
          {t.sub}
        </p>

        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: muted, fontSize: "13px", display: "block", marginBottom: "6px" }}>
            {t.email}
          </label>
          <input
            type="email" placeholder={t.emailPH} value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: "100%", padding: "11px 14px",
              backgroundColor: inp, border: `1px solid ${bord}`,
              borderRadius: "8px", color: text, fontSize: "14px",
              outline: "none", boxSizing: "border-box", direction: "ltr",
              fontFamily: "'Cairo', sans-serif",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "10px" }}>
          <label style={{ color: muted, fontSize: "13px", display: "block", marginBottom: "6px" }}>
            {t.password}
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              placeholder={t.passwordPH} value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{
                width: "100%", padding: "11px 42px 11px 14px",
                backgroundColor: inp, border: `1px solid ${bord}`,
                borderRadius: "8px", color: text, fontSize: "14px",
                outline: "none", boxSizing: "border-box", direction: "ltr",
                fontFamily: "'Cairo', sans-serif",
              }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{
              position: "absolute", top: "50%",
              [lang === "ar" ? "right" : "left"]: "12px",
              transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: muted, fontSize: "14px",
            }}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {/* Forgot */}
        <div style={{ textAlign: lang === "ar" ? "left" : "right", marginBottom: "24px" }}>
          <Link href="/forgot-password" style={{ color: gold, fontSize: "12px", textDecoration: "none" }}>
            {t.forgot}
          </Link>
        </div>

        {error && (
          <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center", marginBottom: "12px" }}>
            {error}
          </p>
        )}

        {/* Login button */}
        <button onClick={handleLogin} disabled={loading} style={{
          backgroundColor: gold, color: "#000", border: "none",
          borderRadius: "10px", padding: "14px",
          fontSize: "15px", fontWeight: 800, cursor: loading ? "wait" : "pointer",
          fontFamily: "'Cairo', sans-serif", opacity: loading ? 0.7 : 1,
          marginBottom: "20px",
        }}>
          {loading ? t.loading : t.loginBtn}
        </button>

        {/* Register link */}
        <p style={{ textAlign: "center", color: muted, fontSize: "13px", margin: 0 }}>
          {t.noAccount}{" "}
          <Link href="/register" style={{ color: gold, fontWeight: 700, textDecoration: "none" }}>
            {t.register}
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
            {t.brand}<br />
            <span style={{ color: gold, fontStyle: "italic" }}>{t.brandHighlight}</span>
          </h2>
          <p style={{ color: "#6b7280", fontSize: "15px", lineHeight: 1.7, maxWidth: "320px", margin: lang === "ar" ? "0 0 0 auto" : "0 auto 0 0" }}>
            {t.brandDesc}
          </p>
          <div style={{ display: "flex", gap: "40px", marginTop: "40px", justifyContent: lang === "ar" ? "flex-end" : "flex-start" }}>
            {[
              { val: "4.9", label: t.stat1 },
              { val: "83",  label: t.stat2 },
              { val: "+247",label: t.stat3 },
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