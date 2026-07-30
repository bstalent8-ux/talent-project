"use client";
export const runtime = "edge";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Languages, Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSite } from "@/contexts/SiteContext";
import styles from "../auth.module.css";

type Role = "talent" | "brand";

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
  brandCategory:   "brand_fashion",
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
  { value: "brand_fashion", ar: "Fashion", en: "Fashion" },
  { value: "brand_food", ar: "Food", en: "Food" },
  { value: "technology", ar: "Tech", en: "Tech" },
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
    talentType:      "نوع الموهبة",
    brandCategory:   "تصنيف البراند",
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
    errTalentType:   "اختار نوع الموهبة",
    errBrandCat:     "اختار تصنيف البراند",
    errGeneric:      "حدث خطأ ما. برجاء المحاولة مرة أخرى.",
    showPass:        "إظهار كلمة المرور",
    hidePass:        "إخفاء كلمة المرور",
    langBtn:         "تغيير اللغة",
    themeBtn:        "تغيير الوضع",
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
    talentType:      "Talent type",
    brandCategory:   "Brand category",
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
    errTalentType:   "Please choose a talent type",
    errBrandCat:     "Please choose a brand category",
    errGeneric:      "Something went wrong. Please try again.",
    showPass:        "Show password",
    hidePass:        "Hide password",
    langBtn:         "Toggle language",
    themeBtn:        "Toggle theme",
    brand2:          "Arab Talent",
    brandHighlight:  "Platform.",
    brandDesc:       "Models, UGC Creators, and Influencers — all in one place. Verified brands. Real collaboration.",
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

const STRENGTH_CLASS = [
  "",
  styles.strengthWeak,
  styles.strengthFair,
  styles.strengthGood,
  styles.strengthStrong,
];

export default function RegisterPage() {
  const router = useRouter();

  // Same provider the rest of the site uses — no local theme/lang state.
  const { lang, dark, toggleLang, toggleMode } = useSite();

  const [form,     setForm]     = useState<FormData>(INIT);
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error,    setError]    = useState("");

  const tx = TX[lang];

  const set = (k: keyof FormData, v: FormData[keyof FormData]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): string => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.confirmPassword)
      return tx.errRequired;
    if (!form.email.includes("@") || !form.email.includes("."))
      return tx.errEmail;
    if (form.phone.replace(/\D/g, "").length < 9)
      return tx.errPhone;
    if (form.role === "talent" && !form.talentType)
      return tx.errTalentType;
    if (form.role === "brand" && !form.brandCategory)
      return tx.errBrandCat;
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
      if (!uid) { setError(tx.errGeneric); setLoading(false); return; }

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
          categoryIds: form.role === "talent" ? [form.talentType] : [form.brandCategory],
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
          ...(form.role === "brand" && {
            brandProfileData: {
              category_id: form.brandCategory,
              company_name: form.fullName.trim(),
              status: "pending",
            },
          }),
        }),
      });

      router.push("/profile/me");
    } catch (e) {
      setError(e instanceof Error ? e.message : tx.errGeneric);
    }
    setLoading(false);
  };

  const passStrength = form.password.length === 0 ? 0 :
    form.password.length < 6 ? 1 :
    form.password.length < 8 ? 2 :
    form.password.match(/[A-Z]/) && form.password.match(/[0-9]/) ? 4 : 3;

  const confirmState =
    !form.confirmPassword                       ? ""
    : form.confirmPassword === form.password    ? styles.inputValid
    :                                             styles.inputInvalid;

  return (
    <div className={styles.authPage}>

      {/* ── FORM SIDE ── */}
      <div className={`${styles.formPane} ${styles.formPaneWide}`}>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={toggleLang}
            aria-label={tx.langBtn}
          >
            <Languages size={14} aria-hidden="true" />
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={toggleMode}
            aria-label={tx.themeBtn}
          >
            {dark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
          </button>
          <Link className={styles.controlLink} href="/login">
            {tx.haveAccount}{" "}
            <span className={styles.controlLinkAccent}>{tx.signIn}</span>
          </Link>
        </div>

        <div className={styles.formInner}>
          <p className={styles.eyebrow}>{tx.eyebrow}</p>
          <h1 className={styles.heading}>{tx.headline}</h1>
          <p className={styles.subheading}>{tx.sub}</p>

          {/* Role toggle */}
          <div className={styles.field}>
            <span className={styles.label}>{tx.iAm}</span>
            <div className={styles.roleRow} role="group" aria-label={tx.iAm}>
              {(["talent", "brand"] as Role[]).map((r) => {
                const active = form.role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    className={`${styles.roleButton} ${active ? styles.roleButtonActive : ""}`}
                    onClick={() => set("role", r)}
                    aria-pressed={active}
                  >
                    {r === "talent" ? tx.talent : tx.brand}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="register-category">
              {form.role === "talent" ? tx.talentType : tx.brandCategory}
            </label>
            <select
              id="register-category"
              className={styles.select}
              value={form.role === "talent" ? form.talentType : form.brandCategory}
              onChange={(event) => {
                if (form.role === "talent") set("talentType", event.target.value);
                else set("brandCategory", event.target.value);
              }}
            >
              {(form.role === "talent" ? TALENT_TYPES : BRAND_CATEGORIES).map((item) => (
                <option key={item.value} value={item.value}>
                  {lang === "ar" ? item.ar : item.en}
                </option>
              ))}
            </select>
          </div>

          {error && <div className={styles.errorBanner} role="alert">{error}</div>}

          {/* Fields */}
          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.label} htmlFor="register-name">{tx.fullName}</label>
              <input
                id="register-name"
                className={styles.input}
                type="text"
                placeholder={tx.fullNamePH}
                value={form.fullName}
                autoComplete="name"
                onChange={(e) => set("fullName", e.target.value)}
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="register-email">{tx.email}</label>
              <input
                id="register-email"
                className={`${styles.input} ${styles.inputLtr}`}
                type="email"
                placeholder={tx.emailPH}
                value={form.email}
                autoComplete="email"
                onChange={(e) => set("email", e.target.value)}
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="register-phone">{tx.phone}</label>
              <input
                id="register-phone"
                className={`${styles.input} ${styles.inputLtr}`}
                type="tel"
                placeholder={tx.phonePH}
                value={form.phone}
                autoComplete="tel"
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="register-password">{tx.password}</label>
              <div className={styles.inputWrap}>
                <input
                  id="register-password"
                  className={`${styles.input} ${styles.inputLtr} ${styles.inputWithAffix}`}
                  type={showPass ? "text" : "password"}
                  placeholder={tx.passwordPH}
                  value={form.password}
                  autoComplete="new-password"
                  onChange={(e) => set("password", e.target.value)}
                />
                <button
                  type="button"
                  className={styles.revealButton}
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? tx.hidePass : tx.showPass}
                >
                  {showPass ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>

              {form.password.length > 0 && (
                <div className={styles.strengthTrack}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`${styles.strengthSegment} ${passStrength >= i ? STRENGTH_CLASS[passStrength] : ""}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={styles.label} htmlFor="register-confirm">{tx.confirm}</label>
              <div className={styles.inputWrap}>
                <input
                  id="register-confirm"
                  className={`${styles.input} ${styles.inputLtr} ${styles.inputWithAffix} ${confirmState}`}
                  type={showConf ? "text" : "password"}
                  placeholder={tx.confirmPH}
                  value={form.confirmPassword}
                  autoComplete="new-password"
                  onChange={(e) => set("confirmPassword", e.target.value)}
                />
                <button
                  type="button"
                  className={styles.revealButton}
                  onClick={() => setShowConf(!showConf)}
                  aria-label={showConf ? tx.hidePass : tx.showPass}
                >
                  {showConf ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className={styles.termsRow}>
              <input
                className={styles.checkbox}
                type="checkbox"
                checked={form.agreeToTerms}
                onChange={(e) => set("agreeToTerms", e.target.checked)}
              />
              <span className={styles.termsText}>
                {tx.terms1}{" "}
                <Link className={styles.textLink} href="/terms">{tx.termsLink}</Link>
                {" "}{tx.terms2}{" "}
                <Link className={styles.textLink} href="/privacy">{tx.privacyLink}</Link>
              </span>
            </label>

            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? tx.loading : tx.submit}
            </button>
          </div>

          <p className={styles.footNote}>
            {tx.haveAccount}{" "}
            <Link className={styles.textLink} href="/login">{tx.signIn}</Link>
          </p>
        </div>
      </div>

      {/* ── BRANDING SIDE — hidden under 768px by the stylesheet ── */}
      <div className={styles.brandPane}>
        <div className={styles.brandTop}>
          <Image
            className={styles.brandLogo}
            src={dark ? "/assets/logo-dark.png" : "/assets/logo-light.png"}
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
            {tx.brand2}<br />
            <span className={styles.brandHighlight}>{tx.brandHighlight}</span>
          </h2>
          <p className={styles.brandDesc}>{tx.brandDesc}</p>

          <div className={styles.statRow}>
            {[
              { val: "4.9",  label: tx.stat1 },
              { val: "83",   label: tx.stat2 },
              { val: "+247", label: tx.stat3 },
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
