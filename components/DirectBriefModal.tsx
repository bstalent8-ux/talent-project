"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, FileText, WalletCards, X } from "lucide-react";
import styles from "./DirectBriefModal.module.css";

type ServiceType = "hourly" | "daily" | "fixed_project";

interface Props {
  talentUserId: string;
  talentName: string;
  talentAvatar?: string | null;
  talentCategory?: string | null;
  dark: boolean;
  lang: "ar" | "en";
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

const TX = {
  ar: {
    title: "طلب حجز",
    subtitle: "أرسل تفاصيل الحملة للموهبة للمراجعة والرد.",
    serviceType: "نوع الخدمة",
    hourly: "بالساعة",
    daily: "باليوم",
    fixed: "مشروع ثابت",
    schedule: "الجدول",
    startDate: "تاريخ البدء المفضل",
    duration: "المدة التقديرية",
    hours: "عدد الساعات",
    days: "عدد الأيام",
    deadline: "الموعد النهائي",
    budget: "الميزانية",
    hourlyRate: "سعر الساعة",
    dailyRate: "سعر اليوم",
    projectBudget: "ميزانية المشروع",
    brief: "البريف",
    briefPlaceholder: "Describe your project, goals, deliverables and expectations.",
    send: "إرسال طلب الحجز",
    sending: "جاري الإرسال...",
    cancel: "إلغاء",
    successTitle: "تم إرسال طلب الحجز",
    successText: "سيصل إشعار للموهبة ويمكنها قبول الطلب أو رفضه أو طلب تعديلات.",
    close: "إغلاق",
    details: "عرض التفاصيل",
    budgetRequired: "الميزانية يجب أن تكون أكبر من صفر.",
    briefRequired: "البريف مطلوب.",
    dateRequired: "اختر تاريخ بدء صحيح.",
    durationRequired: "أدخل مدة صحيحة.",
    deadlineRequired: "اختر موعدًا نهائيًا صحيحًا.",
    duplicate: "يوجد طلب حجز نشط بالفعل مع هذه الموهبة.",
    unauthorized: "سجّل الدخول كبراند لإرسال طلب حجز.",
    generic: "حدث خطأ. حاول مرة أخرى.",
  },
  en: {
    title: "Booking request",
    subtitle: "Send the campaign details for the talent to review and respond.",
    serviceType: "Service type",
    hourly: "Hourly",
    daily: "Daily",
    fixed: "Fixed project",
    schedule: "Schedule",
    startDate: "Preferred start date",
    duration: "Estimated duration",
    hours: "Hours",
    days: "Number of days",
    deadline: "Deadline",
    budget: "Budget",
    hourlyRate: "Hourly rate",
    dailyRate: "Daily rate",
    projectBudget: "Project budget",
    brief: "Brief",
    briefPlaceholder: "Describe your project, goals, deliverables and expectations.",
    send: "Send Booking Request",
    sending: "Sending...",
    cancel: "Cancel",
    successTitle: "Booking request sent",
    successText: "The talent has been notified and can accept, reject, or request changes.",
    close: "Close",
    details: "View details",
    budgetRequired: "Budget must be greater than zero.",
    briefRequired: "Brief is required.",
    dateRequired: "Choose a valid start date.",
    durationRequired: "Enter a valid duration.",
    deadlineRequired: "Choose a valid deadline.",
    duplicate: "There is already an active booking request with this talent.",
    unauthorized: "Sign in as a brand to send a booking request.",
    generic: "Something went wrong. Please try again.",
  },
} as const;

const SERVICE_OPTIONS: { value: ServiceType; icon: React.ReactNode }[] = [
  { value: "hourly", icon: <Clock size={15} /> },
  { value: "daily", icon: <CalendarDays size={15} /> },
  { value: "fixed_project", icon: <FileText size={15} /> },
];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function DirectBriefModal({
  talentUserId,
  talentName,
  talentAvatar,
  talentCategory,
  dark,
  lang,
  onClose,
  onSuccess,
}: Props) {
  const ar = lang === "ar";
  const t = TX[lang];

  const [serviceType, setServiceType] = useState<ServiceType>("fixed_project");
  const [startDate, setStartDate] = useState(todayValue());
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [brief, setBrief] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  const budgetLabel = useMemo(() => {
    if (serviceType === "hourly") return t.hourlyRate;
    if (serviceType === "daily") return t.dailyRate;
    return t.projectBudget;
  }, [serviceType, t]);

  function validate() {
    const budgetValue = Number(budget);
    if (!startDate) return t.dateRequired;
    if (!Number.isFinite(budgetValue) || budgetValue <= 0) return t.budgetRequired;
    if (!brief.trim()) return t.briefRequired;
    if ((serviceType === "hourly" || serviceType === "daily") && (!Number.isInteger(Number(duration)) || Number(duration) <= 0)) {
      return t.durationRequired;
    }
    if (serviceType === "fixed_project" && !deadline) return t.deadlineRequired;
    if (deadline && new Date(deadline) < new Date(startDate)) return t.deadlineRequired;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_user_id: talentUserId,
          service_type: serviceType,
          start_date: startDate,
          duration: serviceType === "fixed_project" ? null : Number(duration),
          deadline: serviceType === "fixed_project" ? deadline : null,
          budget_amount: Number(budget),
          brief: brief.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccessBookingId(data.booking_id);
        return;
      }
      if (res.status === 401 || res.status === 403) setError(t.unauthorized);
      else if (res.status === 409) setError(t.duplicate);
      else setError(data.error ?? t.generic);
    } catch {
      setError(t.generic);
    } finally {
      setSending(false);
    }
  }

  function handleDetails() {
    if (successBookingId) onSuccess(successBookingId);
  }

  return (
    <div
      className={`${styles.overlay} ${dark ? styles.dark : styles.light}`}
      dir={ar ? "rtl" : "ltr"}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="booking-request-title">
        <header className={styles.header}>
          <div className={styles.talentBlock}>
            <span className={styles.avatar}>
              {talentAvatar ? <img src={talentAvatar} alt="" /> : talentName.charAt(0)}
            </span>
            <span>
              <h2 id="booking-request-title">{t.title}</h2>
              <p>{talentName}{talentCategory ? ` · ${talentCategory}` : ""}</p>
            </span>
          </div>
          <button className={styles.iconButton} type="button" onClick={onClose} aria-label={t.close}>
            <X size={18} />
          </button>
        </header>

        {successBookingId ? (
          <div className={styles.success}>
            <span className={styles.successIcon}><CheckCircle2 size={26} /></span>
            <h3>{t.successTitle}</h3>
            <p>{t.successText}</p>
            <div className={styles.actions}>
              <button className={styles.secondaryButton} type="button" onClick={onClose}>{t.close}</button>
              <Link className={styles.primaryButton} href={`/bookings/${successBookingId}`} onClick={handleDetails}>
                {t.details}
              </Link>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <p className={styles.subtitle}>{t.subtitle}</p>

            <fieldset className={styles.fieldset}>
              <legend>{t.serviceType}</legend>
              <div className={styles.segmented}>
                {SERVICE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.segmentButton} ${serviceType === option.value ? styles.segmentButtonActive : ""}`}
                    onClick={() => setServiceType(option.value)}
                  >
                    {option.icon}
                    {option.value === "hourly" ? t.hourly : option.value === "daily" ? t.daily : t.fixed}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className={styles.grid}>
              <label className={styles.field}>
                <span>{t.startDate}</span>
                <input type="date" value={startDate} min={todayValue()} onChange={(e) => setStartDate(e.target.value)} required />
              </label>

              {serviceType === "fixed_project" ? (
                <label className={styles.field}>
                  <span>{t.deadline}</span>
                  <input type="date" value={deadline} min={startDate || todayValue()} onChange={(e) => setDeadline(e.target.value)} required />
                </label>
              ) : (
                <label className={styles.field}>
                  <span>{serviceType === "hourly" ? t.hours : t.days}</span>
                  <input inputMode="numeric" min={1} step={1} type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                </label>
              )}
            </div>

            <label className={styles.field}>
              <span>{budgetLabel}</span>
              <div className={styles.moneyInput}>
                <WalletCards size={16} />
                <input inputMode="decimal" min={1} step="0.01" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} required />
                <b>EGP</b>
              </div>
            </label>

            <label className={styles.field}>
              <span>{t.brief}</span>
              <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder={t.briefPlaceholder} rows={5} required />
            </label>

            {error ? <p className={styles.error}>{error}</p> : null}

            <div className={styles.actions}>
              <button className={styles.secondaryButton} type="button" onClick={onClose} disabled={sending}>{t.cancel}</button>
              <button className={styles.primaryButton} type="submit" disabled={sending}>
                {sending ? t.sending : t.send}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
