"use client";
export const runtime = 'edge';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Languages, Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSite } from "@/contexts/SiteContext";
import { safeNextPath } from "@/lib/safe-next-path";
import styles from "../auth.module.css";

// brandHighlight excludes the trailing "." on purpose — .brandHighlight::after
// draws it in auth.module.css instead, so it can never end up bidi-reordered
// to the wrong side of the word the way a literal trailing "." would.
const tx = {
  ar: {
    eyebrow:    "اهلاً بيك //",
    heading:    "أهلاً بيك من جديد",
    sub:        "سجل دخولك وكمّل من حيث وقفت",
    email:      "البريد الإلكتروني أو اسم المستخدم",
    emailPH:    "example@email.com أو @username",
    password:   "كلمة المرور",
    passwordPH: "كلمة المرور",
    forgot:     "نسيت كلمة المرور؟",
    loginBtn:   "دخول ←",
    noAccount:  "ما عندكش حساب؟",
    register:   "سجّل مجاناً",
    loading:    "جاري...",
    error:      "الإيميل أو كلمة المرور غلط",
    showPass:   "إظهار كلمة المرور",
    hidePass:   "إخفاء كلمة المرور",
    langBtn:    "تغيير اللغة",
    themeBtn:   "تغيير الوضع",
    brand:          "منصة المواهب",
    brandHighlight: "العربية",
    brandDesc:      "موديلز، UGC Creators، وإنفلونسرز — كلهم في مكان واحد. براندات موثقة. تعاون حقيقي.",
    stat1: "متوسط التقييم",
    stat2: "براند",
    stat3: "موهبة",
  },
  en: {
    eyebrow:    "WELCOME BACK //",
    heading:    "Welcome Back",
    sub:        "Sign in and continue where you left off",
    email:      "Email or Username",
    emailPH:    "example@email.com or @username",
    password:   "Password",
    passwordPH: "Your password",
    forgot:     "Forgot password?",
    loginBtn:   "Sign In →",
    noAccount:  "Don't have an account?",
    register:   "Sign up free",
    loading:    "Loading...",
    error:      "Wrong email or password",
    showPass:   "Show password",
    hidePass:   "Hide password",
    langBtn:    "Toggle language",
    themeBtn:   "Toggle theme",
    brand:          "Arab Talent",
    brandHighlight: "Platform",
    brandDesc:      "Models, UGC Creators, and Influencers — all in one place. Verified brands. Real collaboration.",
    stat1: "Avg Rating",
    stat2: "Brands",
    stat3: "Talents",
  },
};

// Accent classes come from the design tokens, not literal hex values.
const floatingTalents = [
  { name: "سارة أحمد", sub: "Fashion · 8.4k", accent: styles.accentTeal },
  { name: "عمر خالد",  sub: "UGC · 12k",      accent: styles.accentGold },
  { name: "مي حسين",   sub: "Model · 5.2k",   accent: styles.accentPurple },
];

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  // Same provider the rest of the site uses — no local theme/lang state.
  const { lang, dark, toggleLang, toggleMode } = useSite();

  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const t = tx[lang];

  async function handleLogin() {
    if (!email || !password) { setError(t.error); return; }
    setLoading(true); setError("");

    // Resolve username → email if needed
    let resolvedEmail = email.trim();
    if (!resolvedEmail.includes("@") || resolvedEmail.startsWith("@")) {
      const handle = resolvedEmail.replace(/^@/, "").toLowerCase();
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: handle }),
      });
      if (!res.ok) { setLoading(false); setError(t.error); return; }
      const { email: found } = await res.json();
      resolvedEmail = found;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
    setLoading(false);
    if (err) { setError(t.error); return; }

    const res = await fetch("/api/me/role");
    const { role } = await res.json();
    router.push(role === "admin" ? "/admin" : safeNextPath() ?? "/explore");
  }

  return (
    <div className={styles.authPage}>

      {/* ── FORM SIDE ── */}
      <div className={styles.formPane}>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={toggleLang}
            aria-label={t.langBtn}
          >
            <Languages size={14} aria-hidden="true" />
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={toggleMode}
            aria-label={t.themeBtn}
          >
            {dark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
          </button>
        </div>

        <div className={styles.formInner}>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1 className={styles.heading}>{t.heading}</h1>
          <p className={styles.subheading}>{t.sub}</p>

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">{t.email}</label>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              placeholder={t.emailPH}
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">{t.password}</label>
            <div className={styles.inputWrap}>
              <input
                id="login-password"
                className={`${styles.input} ${styles.inputWithAffix}`}
                type={showPass ? "text" : "password"}
                placeholder={t.passwordPH}
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                type="button"
                className={styles.revealButton}
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? t.hidePass : t.showPass}
              >
                {showPass ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className={styles.forgotRow}>
            <Link className={styles.textLink} href="/forgot-password">{t.forgot}</Link>
          </div>

          {error && <p className={styles.errorText} role="alert">{error}</p>}

          <button
            type="button"
            className={styles.submitButton}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? t.loading : t.loginBtn}
          </button>

          <p className={styles.footNote}>
            {t.noAccount}{" "}
            <Link className={styles.textLink} href="/register">{t.register}</Link>
          </p>
        </div>
      </div>

      {/* ── BRANDING SIDE — hidden under 768px by the stylesheet ── */}
      <div className={styles.brandPane}>
        <div className={styles.brandTop}>
          {/* Always the white wordmark: .brandPane is a fixed dark photo panel
              now, independent of [data-theme] (see auth.module.css). */}
          <Image
            className={styles.brandLogo}
            src="/assets/logo-dark.png"
            alt="Talents"
            width={110}
            height={32}
          />
        </div>

        <div className={styles.floatingStack}>
          {floatingTalents.map((tl) => (
            <div key={tl.name} className={styles.floatingCard}>
              <div className={`${styles.floatingAvatar} ${tl.accent}`}>{tl.name[0]}</div>
              <div>
                <p className={styles.floatingName}>{tl.name}</p>
                <p className={styles.floatingSub}>{tl.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.brandBottom}>
          <h2 className={styles.brandHeadline}>
            {t.brand}<br />
            <span className={styles.brandHighlight}>{t.brandHighlight}</span>
          </h2>
          <p className={styles.brandDesc}>{t.brandDesc}</p>

          <div className={styles.statRow}>
            {[
              { val: "4.9",  label: t.stat1 },
              { val: "83",   label: t.stat2 },
              { val: "+247", label: t.stat3 },
            ].map((s) => (
              <div key={s.label}>
                <p className={styles.statValue}>{s.val}</p>
                <p className={styles.statLabel}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
