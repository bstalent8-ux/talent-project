"use client";
export const runtime = 'edge';

// ─── Forgot password ─────────────────────────────────────────────────────
// Login's "Forgot password?" link has pointed here since before this file
// existed — hitting it was a 404 (CLAUDE.md's Login section flagged this as
// a known gap). Two steps on one page: email -> 6-digit code + new password,
// via /api/auth/reset-password/{send,complete} (same email_otps + Resend
// path register's email verification already uses).

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Languages, Moon, Sun } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import styles from "../auth.module.css";

const tx = {
  ar: {
    eyebrow:    "استعادة الحساب //",
    heading:    "نسيت كلمة المرور؟",
    sub:        "هنبعتلك كود على إيميلك تقدر تغيّر بيه كلمة المرور.",
    email:      "البريد الإلكتروني",
    emailPH:    "example@email.com",
    sendCode:   "إرسال الكود ←",
    sending:    "جاري الإرسال...",
    sentHeading: "شيك على إيميلك",
    sentSub:    (email: string) => `لو الإيميل دا مسجل عندنا، هتلاقي كود مكوّن من 6 أرقام على ${email}.`,
    code:       "الكود",
    codePH:     "------",
    newPassword: "كلمة المرور الجديدة",
    newPasswordPH: "8 أحرف على الأقل",
    confirmPassword: "تأكيد كلمة المرور",
    confirmPasswordPH: "اكتب كلمة المرور تاني",
    resetBtn:   "تغيير كلمة المرور ←",
    resetting:  "جاري الحفظ...",
    resendCode: "لم يوصلك الكود؟ ابعته تاني",
    resendIn:   (s: number) => `تقدر تطلب كود تاني بعد ${s} ثانية`,
    backToEmail: "غيّر الإيميل",
    successTitle: "اتغيرت كلمة المرور ✓",
    successSub: "تقدر تدخل دلوقتي بكلمة المرور الجديدة.",
    goToLogin:  "دخول ←",
    backToLoginRow: "افتكرت كلمة المرور؟",
    backToLoginLink: "دخول",
    errEmail:     "أدخل بريد إلكتروني صحيح.",
    errCode:      "أدخل الكود المكوّن من 6 أرقام.",
    errPasswordShort: "كلمة المرور لازم تكون 8 أحرف على الأقل.",
    errPasswordMatch: "كلمتا المرور مش متطابقتين.",
    errInvalidCode: "الكود غلط أو منتهي، جرب تاني.",
    errTooManyAttempts: "محاولات كتير غلط — اطلب كود جديد.",
    errCooldown:  "لسه لحظات من آخر كود اتبعت — استنى شوية.",
    errServer:    "حصل خطأ، حاول تاني.",
    langBtn:    "تغيير اللغة",
    themeBtn:   "تغيير الوضع",
    brand:          "منصة المواهب",
    brandHighlight: "العربية",
    brandDesc:      "موديلز، UGC Creators، وإنفلونسرز — كلهم في مكان واحد. براندات موثقة. تعاون حقيقي.",
  },
  en: {
    eyebrow:    "ACCOUNT RECOVERY //",
    heading:    "Forgot password?",
    sub:        "We'll email you a code to set a new password.",
    email:      "Email address",
    emailPH:    "example@email.com",
    sendCode:   "Send code →",
    sending:    "Sending...",
    sentHeading: "Check your email",
    sentSub:    (email: string) => `If ${email} has an account with us, a 6-digit code is on its way.`,
    code:       "Code",
    codePH:     "------",
    newPassword: "New password",
    newPasswordPH: "At least 8 characters",
    confirmPassword: "Confirm password",
    confirmPasswordPH: "Type it again",
    resetBtn:   "Change password →",
    resetting:  "Saving...",
    resendCode: "Didn't get the code? Resend",
    resendIn:   (s: number) => `You can request another code in ${s}s`,
    backToEmail: "Change email",
    successTitle: "Password changed ✓",
    successSub: "You can sign in now with your new password.",
    goToLogin:  "Sign in →",
    backToLoginRow: "Remembered your password?",
    backToLoginLink: "Sign in",
    errEmail:     "Enter a valid email address.",
    errCode:      "Enter the 6-digit code.",
    errPasswordShort: "Password must be at least 8 characters.",
    errPasswordMatch: "Passwords don't match.",
    errInvalidCode: "That code is wrong or expired — try again.",
    errTooManyAttempts: "Too many wrong attempts — request a new code.",
    errCooldown:  "You just requested a code — wait a bit before trying again.",
    errServer:    "Something went wrong, try again.",
    langBtn:    "Toggle language",
    themeBtn:   "Toggle theme",
    brand:          "Arab Talent",
    brandHighlight: "Platform",
    brandDesc:      "Models, UGC Creators, and Influencers — all in one place. Verified brands. Real collaboration.",
  },
};

type Step = "email" | "code" | "done";

export default function ForgotPasswordPage() {
  const { lang, dark, toggleLang, toggleMode } = useSite();
  const t = tx[lang];

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  function tickCooldown(seconds: number) {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  async function sendCode() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(t.errEmail); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), lang }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.error === "cooldown") { setError(t.errCooldown); tickCooldown(json.retryAfterSeconds ?? 45); }
        else setError(t.errServer);
        setLoading(false);
        return;
      }
      tickCooldown(45);
      setStep("code");
    } catch {
      setError(t.errServer);
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (cooldown > 0) return;
    setError("");
    await sendCode();
  }

  async function completeReset() {
    if (!/^\d{6}$/.test(code.trim())) { setError(t.errCode); return; }
    if (password.length < 8) { setError(t.errPasswordShort); return; }
    if (password !== confirmPassword) { setError(t.errPasswordMatch); return; }

    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.error === "too_many_attempts") setError(t.errTooManyAttempts);
        else if (json.error === "expired_or_missing" || json.error === "invalid_code") setError(t.errInvalidCode);
        else setError(t.errServer);
        setLoading(false);
        return;
      }
      setStep("done");
    } catch {
      setError(t.errServer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>

      {/* ── FORM SIDE ── */}
      <div className={styles.formPane}>
        <div className={styles.controls}>
          <button type="button" className={styles.controlButton} onClick={toggleLang} aria-label={t.langBtn}>
            <Languages size={14} aria-hidden="true" />
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button type="button" className={styles.controlButton} onClick={toggleMode} aria-label={t.themeBtn}>
            {dark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
          </button>
        </div>

        <div className={styles.formInner}>
          {step === "done" ? (
            <>
              <p className={styles.eyebrow}>{t.eyebrow}</p>
              <h1 className={styles.heading}>{t.successTitle}</h1>
              <p className={styles.subheading}>{t.successSub}</p>
              <Link href="/login" className={styles.submitButton} style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 16 }}>
                {t.goToLogin}
              </Link>
            </>
          ) : (
            <>
              <p className={styles.eyebrow}>{t.eyebrow}</p>
              <h1 className={styles.heading}>{t.heading}</h1>
              <p className={styles.subheading}>
                {step === "email" ? t.sub : t.sentSub(email.trim())}
              </p>

              {step === "email" && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="fp-email">{t.email}</label>
                  <input
                    id="fp-email"
                    className={styles.input}
                    type="email"
                    placeholder={t.emailPH}
                    value={email}
                    autoComplete="username"
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && sendCode()}
                  />
                </div>
              )}

              {step === "code" && (
                <>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="fp-code">{t.code}</label>
                    <input
                      id="fp-code"
                      className={styles.input}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={t.codePH}
                      value={code}
                      style={{ letterSpacing: 4, textAlign: "center", direction: "ltr" }}
                      onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="fp-password">{t.newPassword}</label>
                    <div className={styles.inputWrap}>
                      <input
                        id="fp-password"
                        className={`${styles.input} ${styles.inputWithAffix}`}
                        type={showPass ? "text" : "password"}
                        placeholder={t.newPasswordPH}
                        value={password}
                        autoComplete="new-password"
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      />
                      <button
                        type="button"
                        className={styles.revealButton}
                        onClick={() => setShowPass(!showPass)}
                        aria-label={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="fp-confirm">{t.confirmPassword}</label>
                    <input
                      id="fp-confirm"
                      className={styles.input}
                      type={showPass ? "text" : "password"}
                      placeholder={t.confirmPasswordPH}
                      value={confirmPassword}
                      autoComplete="new-password"
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && completeReset()}
                    />
                  </div>

                  <div className={styles.forgotRow} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, textAlign: "start", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={resendCode}
                      disabled={cooldown > 0}
                      style={{ background: "none", border: "none", cursor: cooldown > 0 ? "default" : "pointer", padding: 0, opacity: cooldown > 0 ? 0.6 : 1 }}
                    >
                      {cooldown > 0 ? t.resendIn(cooldown) : t.resendCode}
                    </button>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => { setStep("email"); setCode(""); setError(""); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      {t.backToEmail}
                    </button>
                  </div>
                </>
              )}

              {error && <p className={styles.errorText} role="alert">{error}</p>}

              <button
                type="button"
                className={styles.submitButton}
                onClick={step === "email" ? sendCode : completeReset}
                disabled={loading}
              >
                {loading ? (step === "email" ? t.sending : t.resetting) : (step === "email" ? t.sendCode : t.resetBtn)}
              </button>

              <p className={styles.footNote}>
                {t.backToLoginRow}{" "}
                <Link className={styles.textLink} href="/login">{t.backToLoginLink}</Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── BRANDING SIDE ── */}
      <div className={styles.brandPane}>
        <div className={styles.brandTop}>
          <Image className={styles.brandLogo} src="/assets/logo-dark.png" alt="Talents" width={110} height={32} />
        </div>
        <div className={styles.brandBottom}>
          <h2 className={styles.brandHeadline}>
            {t.brand}<br />
            <span className={styles.brandHighlight}>{t.brandHighlight}</span>
          </h2>
          <p className={styles.brandDesc}>{t.brandDesc}</p>
        </div>
      </div>
    </div>
  );
}
