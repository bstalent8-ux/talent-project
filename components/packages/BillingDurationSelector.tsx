"use client";

import type { LandingLang } from "@/app/(main)/home/_components/landing/content";
import styles from "./PackagePricing.module.css";

const DURATIONS = [
  { value: 1, ar: "شهري", en: "Monthly" },
  { value: 12, ar: "سنوي", en: "Yearly" },
] as const;

export default function BillingDurationSelector({
  lang,
  value,
  availableDurations,
  onChange,
}: {
  lang: LandingLang;
  value: number;
  availableDurations: number[];
  onChange: (duration: number) => void;
}) {
  const available = new Set(availableDurations);

  return (
    <div className={styles.durationTabs} role="radiogroup" aria-label={lang === "ar" ? "مدة الاشتراك" : "Subscription duration"}>
      {DURATIONS.map((duration) => {
        const disabled = !available.has(duration.value);
        const active = value === duration.value;
        return (
          <button
            className={`${styles.durationTab} ${active ? styles.tabActive : ""}`}
            disabled={disabled}
            key={duration.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(duration.value)}
          >
            {duration[lang]}
          </button>
        );
      })}
    </div>
  );
}
