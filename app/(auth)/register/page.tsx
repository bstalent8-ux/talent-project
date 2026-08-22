"use client";
export const runtime = "edge";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Languages, Moon, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSite } from "@/contexts/SiteContext";
import { safeNextPath } from "@/lib/safe-next-path";
import SupportTicketModal from "@/components/support/SupportTicketModal";
import styles from "../auth.module.css";
import PhoneInput from "../phone/PhoneInput";
import { detectDefaultCountryIso, findCountry, rememberCountryIso } from "../phone/countries";
import {
  FIELD_IDS,
  FIELD_ORDER,
  FORM_TO_FIELD,
  mapSignUpError,
  validateRegisterForm,
  type FieldKey,
  type Role,
  type RegisterFormData as FormData,
} from "./registerValidation";

const INIT: FormData = {
  fullName:        "",
  email:           "",
  phoneNumber:     "",
  password:        "",
  confirmPassword: "",
  role:            "talent",
  talentType:      "ugc",
  otherTypeText:   "",
  brandCategory:   "brand_fashion",
  agreeToTerms:    false,
};

// Canonical registration categories — UGC and Model are the only real,
// public talent categories (this is a NEW-signup gate only: existing
// talent_profiles rows with legacy category values are untouched —
// getWizardSteps() and the public-profile Model gate already key off "model"
// alone, everything else falls into the generic/UGC path).
//
// "other" is NOT a real category: picking it creates no talent_profiles row
// at all (see handleSubmit's `isOtherTalentType` branch) — only a profiles
// row plus a talent_type_requests row for admin analytics, then routes to
// /waitlist instead of the UGC/Model onboarding flow.
const TALENT_TYPES = [
  { value: "ugc",   ar: "صانع محتوى UGC", en: "UGC Creator" },
  { value: "model", ar: "موديل",           en: "Model" },
  { value: "other", ar: "أخرى",            en: "Other" },
];

const BRAND_CATEGORIES = [
  { value: "brand_fashion", ar: "Fashion", en: "Fashion" },
  { value: "brand_food", ar: "Food", en: "Food" },
  { value: "technology", ar: "Tech", en: "Tech" },
];

// brandHighlight excludes the trailing "." on purpose — .brandHighlight::after
// draws it in auth.module.css instead, so it can never end up bidi-reordered
// to the wrong side of the word the way a literal trailing "." would.
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
    otherTypeLabel:  "ما نوع الموهبة التي تقدمها؟",
    otherTypePH:     "مثلاً: ممثل، مصور، معلق صوتي، مذيع، ستايلست",
    brandCategory:   "تصنيف البراند",
    terms1:          "أوافق على",
    termsLink:       "الشروط والأحكام",
    terms2:          "و",
    privacyLink:     "سياسة الخصوصية",
    submit:          "إنشاء الحساب ←",
    loading:         "جاري الإنشاء...",
    haveAccount:     "لديك حساب؟",
    signIn:          "تسجيل الدخول",
    // Field-level errors
    errFullNameRequired: "الاسم الكامل مطلوب.",
    errEmailRequired:    "البريد الإلكتروني مطلوب.",
    errEmailInvalid:     "أدخل بريدًا إلكترونيًا صحيحًا، مثل: name@example.com.",
    errPhoneRequired:    "رقم الهاتف مطلوب.",
    errPhoneInvalid:     "أدخل رقم هاتف صحيح.",
    errPasswordRequired: "كلمة المرور مطلوبة.",
    errPasswordWeak:     "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    errConfirmRequired:  "الرجاء تأكيد كلمة المرور.",
    errPassMismatch:     "كلمتا المرور غير متطابقتين.",
    errTerms:            "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية.",
    errCategoryTalent:   "اختر نوع حسابك: صانع محتوى UGC أو موديل.",
    errCategoryBrand:    "اختار تصنيف البراند.",
    errOtherTypeRequired: "من فضلك اكتب نوع الموهبة التي تقدمها.",
    // Server-level errors
    errExisting:      "يوجد حساب مسجل بالفعل بهذا البريد الإلكتروني. سجل الدخول أو استخدم بريدًا إلكترونيًا آخر.",
    errNetwork:       "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.",
    errRateLimit:     "تم إجراء محاولات تسجيل كثيرة. انتظر قليلًا ثم حاول مرة أخرى.",
    errProfileFailure: "تعذر إكمال إنشاء حسابك. حاول مرة أخرى.",
    errUnknown:       "تعذر إنشاء الحساب. راجع بياناتك وحاول مرة أخرى.",
    showPass:        "إظهار كلمة المرور",
    hidePass:        "إخفاء كلمة المرور",
    langBtn:         "تغيير اللغة",
    themeBtn:        "تغيير الوضع",
    brand2:          "منصة المواهب",
    brandHighlight:  "العربية",
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
    otherTypeLabel:  "What type of talent are you?",
    otherTypePH:     "e.g. Actor, Photographer, Voice Over, Presenter, Stylist",
    brandCategory:   "Brand category",
    terms1:          "I agree to the",
    termsLink:       "Terms of Service",
    terms2:          "and",
    privacyLink:     "Privacy Policy",
    submit:          "Create account →",
    loading:         "Creating...",
    haveAccount:     "Already have an account?",
    signIn:          "Sign in",
    // Field-level errors
    errFullNameRequired: "Full name is required.",
    errEmailRequired:    "Email address is required.",
    errEmailInvalid:     "Enter a valid email address, for example: name@example.com.",
    errPhoneRequired:    "Phone number is required.",
    errPhoneInvalid:     "Enter a valid phone number.",
    errPasswordRequired: "Password is required.",
    errPasswordWeak:     "Password must be at least 8 characters.",
    errConfirmRequired:  "Please confirm your password.",
    errPassMismatch:     "Passwords do not match.",
    errTerms:            "You must agree to the Terms of Service and Privacy Policy.",
    errCategoryTalent:   "Choose whether you are registering as a UGC Creator or Model.",
    errCategoryBrand:    "Please choose a brand category.",
    errOtherTypeRequired: "Please tell us what type of talent you are.",
    // Server-level errors
    errExisting:      "An account with this email already exists. Sign in instead or use a different email.",
    errNetwork:       "We couldn't connect to the server. Check your connection and try again.",
    errRateLimit:     "Too many registration attempts. Please wait a moment and try again.",
    errProfileFailure: "Your account could not be completed. Please try again.",
    errUnknown:       "We couldn't create your account. Check your information and try again.",
    showPass:        "Show password",
    hidePass:        "Hide password",
    langBtn:         "Toggle language",
    themeBtn:        "Toggle theme",
    brand2:          "Arab Talent",
    brandHighlight:  "Platform",
    brandDesc:       "Models, UGC Creators, and Influencers — all in one place. Verified brands. Real collaboration.",
    stat1: "Avg Rating",
    stat2: "Brands",
    stat3: "Talents",
  },
};

type Tx = typeof TX["en"];

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

  const [form,        setForm]        = useState<FormData>(INIT);
  const [loading,     setLoading]     = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showConf,    setShowConf]    = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [signInPrompt, setSignInPrompt] = useState(false);

  // Synchronous re-entrancy guard: React state (`loading`) only disables the
  // button after a re-render, which leaves a real window for a second click
  // to fire a second signUp() before that render commits. A ref updates
  // instantly, so the second call bails out before touching the network.
  const isSubmittingRef = useRef(false);

  // SSR-safe default ("SA", matching the field's previous static default) —
  // detectDefaultCountryIso() reads navigator/localStorage, which don't exist
  // during edge/server render, so it's re-run client-side in the effect below
  // rather than as the useState initializer. That avoids a hydration mismatch
  // between what the server rendered and what the browser would compute.
  const [phoneCountryIso, setPhoneCountryIso] = useState("SA");

  useEffect(() => {
    setPhoneCountryIso(detectDefaultCountryIso());
  }, []);

  // Captured once on mount, not via useSearchParams — avoids a Suspense
  // boundary requirement for a value only ever read at submit time.
  const utmRef = useRef<{ source: string | null; campaign: string | null }>({ source: null, campaign: null });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    utmRef.current = {
      source:   params.get("utm_source"),
      campaign: params.get("utm_campaign"),
    };
  }, []);

  function handleCountryChange(iso: string) {
    setPhoneCountryIso(iso);
    rememberCountryIso(iso);
  }

  const tx = TX[lang];

  function focusField(key: FieldKey) {
    document.getElementById(FIELD_IDS[key])?.focus();
  }

  function clearFieldError(key: FieldKey) {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (key === "email") setSignInPrompt(false);
  }

  const set = (k: keyof FormData, v: FormData[keyof FormData]) => {
    setForm((f) => ({ ...f, [k]: v }));
    const fieldKey = FORM_TO_FIELD[k];
    if (fieldKey) clearFieldError(fieldKey);
    // A stale server-level banner (network/rate-limit/profile-failure/unknown)
    // no longer describes the form once the user starts changing it.
    setServerError(null);
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;

    const errs = validateRegisterForm(form, tx);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setServerError(null);
      const firstInvalid = FIELD_ORDER.find((key) => errs[key]);
      if (firstInvalid) focusField(firstInvalid);
      return;
    }

    isSubmittingRef.current = true;
    setFieldErrors({});
    setServerError(null);
    setSignInPrompt(false);
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpErr } = await supabase.auth.signUp({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        options:  { data: { role: form.role, full_name: form.fullName.trim() } },
      });

      if (signUpErr) {
        const mapped = mapSignUpError(signUpErr, tx, (unmapped) => {
          console.error("[register] unmapped signUp error", unmapped);
        });
        if (mapped.field) {
          setFieldErrors({ [mapped.field]: mapped.message });
          setSignInPrompt(mapped.action === "signin");
          focusField(mapped.field);
        } else {
          setServerError(mapped.message);
        }
        return;
      }

      const uid = data.user?.id;
      if (!uid) {
        console.error("[register] signUp succeeded with no user id", data);
        setServerError(tx.errUnknown);
        return;
      }

      const handle = form.email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-");

      // "other" is demand-tracking only — it must never become a real
      // talent category. No categoryIds, no talent_profiles row at all (see
      // the profileRes body below) — only profiles + talent_type_requests.
      const isOtherTalentType = form.role === "talent" && form.talentType === "other";

      // Composed here, not stored pre-joined in state (the brief: "Do NOT
      // merge the country code into the typed value"). /api/profile's
      // contract is unchanged — profileData.phone_number is still a single
      // string — this just sends a more complete one than before, since the
      // dial code used to depend on the user having typed it into the same
      // field themselves.
      const dialCode    = findCountry(phoneCountryIso).dialCode;
      const phoneNumber = `+${dialCode}${form.phoneNumber.replace(/\D/g, "")}`;

      const profileRes = await fetch("/api/profile", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          userId: uid,
          role:   form.role,
          profileData: {
            handle,
            full_name:    form.fullName.trim(),
            phone_number: phoneNumber,
          },
          categoryIds: form.role === "talent"
            ? (isOtherTalentType ? [] : [form.talentType])
            : [form.brandCategory],
          // "other" gets no talent_profiles row at all — not even with a
          // free-text category value. No row means: not eligible for
          // onboarding, invisible to Explore (which inner-joins
          // talent_profiles), and no public /talent/[handle] page. The
          // profiles row (role: "talent") still exists so auth/login and
          // talent_type_requests both work.
          ...(form.role === "talent" && !isOtherTalentType && {
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

      if (!profileRes.ok) {
        // The auth account now exists even though profile creation failed —
        // this used to be swallowed silently and the user was redirected
        // anyway, which is exactly how a genuinely-new signup turns into a
        // confusing "already registered" on the next attempt. Surface a safe
        // message and stop here instead of pretending it worked.
        let detail = "";
        try { detail = JSON.stringify(await profileRes.json()); } catch { /* ignore */ }
        console.error("[register] profile creation failed", profileRes.status, detail);
        setServerError(tx.errProfileFailure);
        return;
      }

      // Analytics-only — logged for every talent signup (ugc/model/other) so
      // admin demand tracking can compare all three, but never blocks
      // registration if it fails.
      if (form.role === "talent") {
        fetch("/api/talent-type-requests", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            selected_type:   form.talentType,
            other_type_text: isOtherTalentType ? form.otherTypeText.trim() : null,
            utm_source:      utmRef.current.source,
            utm_campaign:    utmRef.current.campaign,
          }),
        }).catch((e) => console.error("[register] talent-type-request logging failed", e));
      }

      // A specific safeNextPath (e.g. resuming a booking flow) always wins —
      // onboarding/waitlist are only the default first stop for a fresh
      // talent signup. "other" never enters the UGC/Model onboarding flow —
      // it has no supported profile to build yet.
      if (isOtherTalentType) {
        sessionStorage.setItem("talent_other_type_text", form.otherTypeText.trim());
      }
      router.push(safeNextPath() ?? (
        form.role !== "talent" ? "/profile/me" :
        isOtherTalentType      ? "/waitlist" :
        "/onboarding"
      ));
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (/fetch|network/i.test(message)) {
        setServerError(tx.errNetwork);
      } else {
        console.error("[register] unexpected error", e);
        setServerError(tx.errUnknown);
      }
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
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

          {serverError && (
            <p className={styles.errorBanner} role="alert">{serverError}</p>
          )}

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
              className={`${styles.select} ${fieldErrors.category ? styles.inputInvalid : ""}`}
              value={form.role === "talent" ? form.talentType : form.brandCategory}
              aria-invalid={Boolean(fieldErrors.category) || undefined}
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
            {fieldErrors.category && (
              <p className={styles.fieldError} role="alert">{fieldErrors.category}</p>
            )}
          </div>

          {form.role === "talent" && form.talentType === "other" && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-other-type">{tx.otherTypeLabel}</label>
              <input
                id="register-other-type"
                className={`${styles.input} ${fieldErrors.otherTypeText ? styles.inputInvalid : ""}`}
                type="text"
                placeholder={tx.otherTypePH}
                value={form.otherTypeText}
                aria-invalid={Boolean(fieldErrors.otherTypeText) || undefined}
                onChange={(e) => set("otherTypeText", e.target.value)}
              />
              {fieldErrors.otherTypeText && (
                <p className={styles.fieldError} role="alert">{fieldErrors.otherTypeText}</p>
              )}
            </div>
          )}

          {/* Fields */}
          <div className={styles.fieldGroup}>
            <div>
              <label className={styles.label} htmlFor="register-name">{tx.fullName}</label>
              <input
                id="register-name"
                className={`${styles.input} ${fieldErrors.fullName ? styles.inputInvalid : ""}`}
                type="text"
                placeholder={tx.fullNamePH}
                value={form.fullName}
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.fullName) || undefined}
                onChange={(e) => set("fullName", e.target.value)}
              />
              {fieldErrors.fullName && (
                <p className={styles.fieldError} role="alert">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className={styles.label} htmlFor="register-email">{tx.email}</label>
              <input
                id="register-email"
                className={`${styles.input} ${fieldErrors.email ? styles.inputInvalid : ""}`}
                type="email"
                placeholder={tx.emailPH}
                value={form.email}
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email) || undefined}
                onChange={(e) => set("email", e.target.value)}
              />
              {fieldErrors.email && (
                <p className={styles.fieldError} role="alert">
                  {fieldErrors.email}
                  {signInPrompt && (
                    <>
                      {" "}
                      <Link className={styles.textLink} href="/login">{tx.signIn}</Link>
                    </>
                  )}
                </p>
              )}
            </div>

            <div>
              <label className={styles.label} htmlFor="register-phone">{tx.phone}</label>
              <PhoneInput
                countryIso={phoneCountryIso}
                lang={lang}
                number={form.phoneNumber}
                numberAutoComplete="tel-national"
                numberInputId="register-phone"
                numberPlaceholder={tx.phonePH}
                invalid={Boolean(fieldErrors.phone)}
                onCountryChange={handleCountryChange}
                onNumberChange={(value) => set("phoneNumber", value)}
              />
              {fieldErrors.phone && (
                <p className={styles.fieldError} role="alert">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label className={styles.label} htmlFor="register-password">{tx.password}</label>
              <div className={styles.inputWrap}>
                <input
                  id="register-password"
                  className={`${styles.input} ${styles.inputWithAffix} ${fieldErrors.password ? styles.inputInvalid : ""}`}
                  type={showPass ? "text" : "password"}
                  placeholder={tx.passwordPH}
                  value={form.password}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.password) || undefined}
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
              {fieldErrors.password && (
                <p className={styles.fieldError} role="alert">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className={styles.label} htmlFor="register-confirm">{tx.confirm}</label>
              <div className={styles.inputWrap}>
                <input
                  id="register-confirm"
                  className={`${styles.input} ${styles.inputWithAffix} ${fieldErrors.confirmPassword ? styles.inputInvalid : confirmState}`}
                  type={showConf ? "text" : "password"}
                  placeholder={tx.confirmPH}
                  value={form.confirmPassword}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.confirmPassword) || undefined}
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
              {fieldErrors.confirmPassword && (
                <p className={styles.fieldError} role="alert">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <label className={styles.termsRow}>
              <input
                id="register-terms"
                className={styles.checkbox}
                type="checkbox"
                checked={form.agreeToTerms}
                aria-invalid={Boolean(fieldErrors.terms) || undefined}
                onChange={(e) => set("agreeToTerms", e.target.checked)}
              />
              <span className={styles.termsText}>
                {tx.terms1}{" "}
                <Link className={styles.textLink} href="/terms">{tx.termsLink}</Link>
                {" "}{tx.terms2}{" "}
                <Link className={styles.textLink} href="/privacy">{tx.privacyLink}</Link>
              </span>
            </label>
            {fieldErrors.terms && (
              <p className={styles.fieldError} role="alert">{fieldErrors.terms}</p>
            )}

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

          <div style={{ textAlign: "center", marginTop: 10 }}>
            <SupportTicketModal page="register" pageError={serverError} />
          </div>
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
