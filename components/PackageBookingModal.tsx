"use client";

// ─── Package booking — Flow 1 ("جاهزة") ─────────────────────────────────────
// Fixed price, no negotiation: the brand already chose a real package +
// usage-rights add-ons on the profile page (StickyBar/UsageRightsSection),
// so this modal only asks for a date/slot from the talent's OWN real
// availability_schedule (lib/availability-schedule.ts) and sends a request.
// The talent then just accepts or declines — see PackageRequestView.tsx on
// the booking-detail side. No booking_briefs row is created here; the
// package + add-ons ARE the scope, there is no free-text brief to store.

import { useMemo, useState } from "react";
import { CheckCircle2, Send, X } from "lucide-react";
import { cdnImage } from "@/lib/images";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { canCreateBooking } from "@/lib/permissions";
import { parsePrice } from "@/lib/utils";
import type { AddonItem, PackageItem } from "@/features/talent-profile/types";
import type { AvailabilitySchedule } from "@/lib/availability-schedule";
import styles from "./DirectBriefModal.module.css";

interface Props {
  talentUserId: string;
  talentName: string;
  talentAvatar?: string | null;
  talentCategory?: string | null;
  dark: boolean;
  lang: "ar" | "en";
  selectedPackage: PackageItem;
  addons: AddonItem[];
  checkedAddons: Record<string, boolean>;
  availabilitySchedule: AvailabilitySchedule | null | undefined;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

const TX = {
  ar: {
    title: "حجز باقة",
    subtitle: "السعر ثابت — اختار الموعد وابعت الطلب.",
    dateLabel: "اختار موعد من مواعيد الموهبة المتاحة",
    noDates: "الموهبة لسه ما حددتش مواعيد على التقويم — اختار تاريخ تفضله وهنراجعه معاها.",
    fallbackDate: "التاريخ المفضل",
    total: "الإجمالي",
    send: "إرسال الطلب",
    sending: "جاري الإرسال...",
    cancel: "إلغاء",
    successTitle: "تم إرسال طلبك",
    successText: "هتوصلك إشعار لما الموهبة ترد.",
    close: "إغلاق",
    details: "عرض التفاصيل",
    dateRequired: "اختار موعد أولاً.",
    unauthorized: "سجّل الدخول كبراند لإرسال طلب حجز.",
    duplicate: "يوجد طلب حجز نشط بالفعل مع هذه الموهبة.",
    generic: "حدث خطأ. حاول مرة أخرى.",
  },
  en: {
    title: "Book package",
    subtitle: "Price is fixed — pick a date and send the request.",
    dateLabel: "Pick one of the talent's available dates",
    noDates: "The talent hasn't set calendar dates yet — pick a date you'd prefer and we'll confirm it with them.",
    fallbackDate: "Preferred date",
    total: "Total",
    send: "Send Request",
    sending: "Sending...",
    cancel: "Cancel",
    successTitle: "Request sent",
    successText: "You'll be notified once the talent responds.",
    close: "Close",
    details: "View details",
    dateRequired: "Pick a date first.",
    unauthorized: "Sign in as a brand to send a booking request.",
    duplicate: "There is already an active booking request with this talent.",
    generic: "Something went wrong. Please try again.",
  },
} as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function PackageBookingModal({
  talentUserId,
  talentName,
  talentAvatar,
  talentCategory,
  dark,
  lang,
  selectedPackage,
  addons,
  checkedAddons,
  availabilitySchedule,
  onClose,
  onSuccess,
}: Props) {
  const ar = lang === "ar";
  const t = TX[lang];
  const { user, requestAuth } = useGuestGuard();

  const chosenAddons = useMemo(
    () => addons.filter((a) => checkedAddons[a.key]),
    [addons, checkedAddons],
  );
  const packagePrice = parsePrice(selectedPackage.price);
  const addonsTotal = chosenAddons.reduce((sum, a) => sum + a.price, 0);
  const total = packagePrice + addonsTotal;

  const today = todayISO();
  const upcomingDates = useMemo(() => {
    const dates = Object.keys(availabilitySchedule?.dates ?? {}).filter((d) => d >= today);
    dates.sort();
    return dates;
  }, [availabilitySchedule, today]);

  const [selectedDate, setSelectedDate] = useState<string | null>(upcomingDates[0] ?? null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [fallbackDate, setFallbackDate] = useState(today);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  const hasRealDates = upcomingDates.length > 0;
  const slotsForSelectedDate = selectedDate ? (availabilitySchedule?.dates[selectedDate] ?? []) : [];

  async function handleSubmit() {
    if (!canCreateBooking(user).allowed) {
      onClose();
      requestAuth("create_booking");
      return;
    }

    const date = hasRealDates ? selectedDate : fallbackDate;
    if (!date) {
      setError(t.dateRequired);
      return;
    }
    const slot = hasRealDates ? slotsForSelectedDate[selectedSlotIndex] ?? null : null;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings/package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_user_id: talentUserId,
          package_id: selectedPackage.id,
          package_name: selectedPackage.name,
          amount: total,
          addons: chosenAddons.map((a) => ({ key: a.key, label: a.label, price: a.price })),
          scheduled_date: date,
          scheduled_start: slot?.start ?? null,
          scheduled_end: slot?.end ?? null,
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

  return (
    <div
      className={`${styles.overlay} ${dark ? styles.dark : styles.light}`}
      dir={ar ? "rtl" : "ltr"}
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="package-booking-title">
        <header className={styles.header}>
          <div className={styles.talentBlock}>
            <span className={styles.avatar}>
              {talentAvatar ? <img src={cdnImage(talentAvatar, 128)} alt="" /> : talentName.charAt(0)}
            </span>
            <span>
              <h2 id="package-booking-title">{t.title}</h2>
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
              <a className={styles.primaryButton} href={`/bookings/${successBookingId}`} onClick={() => onSuccess(successBookingId)}>
                {t.details}
              </a>
            </div>
          </div>
        ) : (
          <div className={styles.form}>
            <p className={styles.subtitle}>{t.subtitle}</p>

            <div className={styles.fieldset}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong style={{ fontSize: 14 }}>{selectedPackage.name}</strong>
                <span style={{ fontFamily: "monospace" }}>{packagePrice.toLocaleString()} EGP</span>
              </div>
              {chosenAddons.map((a) => (
                <div key={a.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-muted, #64748b)", marginTop: 6 }}>
                  <span>+ {a.label}</span>
                  <span style={{ fontFamily: "monospace" }}>{a.price.toLocaleString()} EGP</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px dashed rgba(128,128,128,0.3)", fontWeight: 800 }}>
                <span>{t.total}</span>
                <span style={{ fontFamily: "monospace" }}>{total.toLocaleString()} EGP</span>
              </div>
            </div>

            <fieldset className={styles.fieldset}>
              <legend>{t.dateLabel}</legend>
              {hasRealDates ? (
                <>
                  <div className={styles.segmented} style={{ flexWrap: "wrap" }}>
                    {upcomingDates.slice(0, 10).map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`${styles.segmentButton} ${selectedDate === d ? styles.segmentButtonActive : ""}`}
                        onClick={() => { setSelectedDate(d); setSelectedSlotIndex(0); }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  {slotsForSelectedDate.length > 0 && (
                    <div className={styles.segmented} style={{ marginTop: 8 }}>
                      {slotsForSelectedDate.map((s, i) => (
                        <button
                          key={`${s.start}-${s.end}`}
                          type="button"
                          className={`${styles.segmentButton} ${selectedSlotIndex === i ? styles.segmentButtonActive : ""}`}
                          onClick={() => setSelectedSlotIndex(i)}
                        >
                          {s.start} – {s.end}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontSize: 12.5, color: "var(--text-muted, #64748b)", margin: "0 0 8px" }}>{t.noDates}</p>
                  <label className={styles.field}>
                    <span>{t.fallbackDate}</span>
                    <input type="date" value={fallbackDate} min={today} onChange={(e) => setFallbackDate(e.target.value)} />
                  </label>
                </>
              )}
            </fieldset>

            {error ? <p className={styles.error}>{error}</p> : null}

            <div className={styles.actions}>
              <button className={styles.secondaryButton} type="button" onClick={onClose} disabled={sending}>{t.cancel}</button>
              <button className={styles.primaryButton} type="button" onClick={handleSubmit} disabled={sending}>
                <Send size={14} style={{ marginInlineEnd: 6 }} />
                {sending ? t.sending : t.send}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
