"use client";
export const runtime = "edge";

// Shown right after a fresh "Other" talent signup instead of the UGC/Model
// onboarding flow — see register/page.tsx's isOtherTalentType branch.
// UGC and Model are the only supported public talent categories today
// (CLAUDE.md §12), so "other" signups land here rather than being pushed
// into a profile-building wizard that doesn't fit them.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import styles from "../auth.module.css";

const TX = {
  ar: {
    eyebrow: "شكراً لتسجيلك //",
    heading: "أنت على قائمة الانتظار",
    body: "حالياً بنركّز على صنّاع محتوى UGC والموديلز بس. لما نفتح نوع الموهبة اللي اخترته هنبعتلك إشعار فوراً.",
    typeLabel: "نوع الموهبة اللي كتبتها:",
    cta: "روح لملفك الشخصي",
  },
  en: {
    eyebrow: "THANKS FOR SIGNING UP //",
    heading: "You're on the waitlist",
    body: "We currently only support UGC Creators and Models. We'll notify you the moment the talent type you picked opens up.",
    typeLabel: "The talent type you entered:",
    cta: "Go to your profile",
  },
};

export default function WaitlistPage() {
  const { lang, dark } = useSite();
  const tx = TX[lang];

  // Read-only display of what the user just typed, carried via sessionStorage
  // from register/page.tsx rather than a query param — keeps it out of the URL.
  const [otherTypeText, setOtherTypeText] = useState<string | null>(null);
  useEffect(() => {
    setOtherTypeText(sessionStorage.getItem("talent_other_type_text"));
  }, []);

  return (
    <div className={styles.authPage}>
      <div className={`${styles.formPane} ${styles.formPaneWide}`} style={{ margin: "0 auto", float: "none" }}>
        <div className={styles.formInner} style={{ textAlign: "center", alignItems: "center" }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: dark ? "rgba(0,210,106,0.12)" : "rgba(0,210,106,0.10)",
              margin: "0 auto 16px",
            }}
          >
            <Clock3 size={26} color="#00D26A" aria-hidden="true" />
          </div>
          <p className={styles.eyebrow}>{tx.eyebrow}</p>
          <h1 className={styles.heading}>{tx.heading}</h1>
          <p className={styles.subheading}>{tx.body}</p>

          {otherTypeText && (
            <p className={styles.subheading} style={{ marginTop: 4 }}>
              {tx.typeLabel} <strong>{otherTypeText}</strong>
            </p>
          )}

          <Link href="/profile/me" className={styles.submitButton} style={{ display: "inline-flex", marginTop: 20, textDecoration: "none" }}>
            {tx.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
