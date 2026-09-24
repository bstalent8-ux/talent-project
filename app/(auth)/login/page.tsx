"use client";
export const runtime = 'edge';

import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { safeNextPath } from "@/lib/safe-next-path";
import SupportTicketModal from "@/components/support/SupportTicketModal";
import { trackEvent } from "@/lib/analytics/track";
import { AuthLink } from "../_components/AuthShell";
import styles from "../auth.module.css";

const tx = {
  ar: {
    heading:    "أهلاً بيك من جديد",
    sub:        "سجل دخولك وكمّل من حيث وقفت",
    email:      "البريد الإلكتروني أو اسم المستخدم",
    emailPH:    "example@email.com أو @username",
    password:   "كلمة المرور",
    passwordPH: "كلمة المرور",
    forgot:     "نسيت كلمة المرور؟",
    loginBtn:   "دخول",
    noAccount:  "ما عندكش حساب؟",
    register:   "سجّل مجاناً",
    loading:    "جاري...",
    error:      "الإيميل أو كلمة المرور غلط",
    showPass:   "إظهار كلمة المرور",
    hidePass:   "إخفاء كلمة المرور",
  },
  en: {
    heading:    "Welcome Back",
    sub:        "Sign in and continue where you left off",
    email:      "Email or Username",
    emailPH:    "example@email.com or @username",
    password:   "Password",
    passwordPH: "Your password",
    forgot:     "Forgot password?",
    loginBtn:   "Sign In",
    noAccount:  "Don't have an account?",
    register:   "Sign up free",
    loading:    "Loading...",
    error:      "Wrong email or password",
    showPass:   "Show password",
    hidePass:   "Hide password",
  },
};

export default function LoginPage() {
  // Same provider the rest of the site uses — no local theme/lang state.
  const { lang } = useSite();

  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const t = tx[lang];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  async function handleLogin() {
    if (!email || !password) { setError(t.error); return; }
    setLoading(true); setError("");

    // Sign in server-side. The route resolves an @handle to its account
    // without ever returning the email, sets the auth cookies on the
    // response, and answers the same way for a bad handle and a bad
    // password. (Replaces the old /api/auth/lookup + browser signIn, which
    // leaked any user's email to an unauthenticated caller.)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email.trim(), password }),
    });

    if (!res.ok) { setLoading(false); setError(t.error); return; }
    const { role } = await res.json();

    trackEvent("login", { metadata: { role } });

    // Full navigation, not router.push — guarantees every server component
    // and the middleware re-read the freshly-set auth cookies.
    window.location.assign(role === "admin" ? "/admin" : safeNextPath() ?? "/explore");
  }

  return (
    <>
      <h1 className={styles.heading}>{t.heading}</h1>
      <p className={styles.subheading}>{t.sub}</p>

      {/* Email */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-email">{t.email}</label>
        <div className={styles.inputWrap}>
          <Mail className={styles.inputIcon} size={18} aria-hidden="true" />
          <input
            id="login-email"
            className={`${styles.input} ${styles.inputWithIcon}`}
            type="email"
            placeholder={t.emailPH}
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Password */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-password">{t.password}</label>
        <div className={styles.inputWrap}>
          <Lock className={styles.inputIcon} size={18} aria-hidden="true" />
          <input
            id="login-password"
            className={`${styles.input} ${styles.inputWithIcon} ${styles.inputWithAffix}`}
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
            {showPass ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className={styles.forgotRow}>
        <AuthLink className={styles.textLink} href="/forgot-password">{t.forgot}</AuthLink>
      </div>

      {error && <p className={styles.errorText} role="alert">{error}</p>}

      <button
        type="button"
        className={styles.submitButton}
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? t.loading : (<>{t.loginBtn}<Arrow size={18} aria-hidden="true" /></>)}
      </button>

      <p className={styles.footNote}>
        {t.noAccount}{" "}
        <AuthLink className={styles.textLink} href="/register">{t.register}</AuthLink>
      </p>

      <div style={{ textAlign: "center", marginTop: 10 }}>
        <span className={styles.helpIn}>
          <SupportTicketModal page="login" pageError={error || null} />
        </span>
      </div>
    </>
  );
}
