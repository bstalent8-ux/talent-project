"use client";
import Link from "next/link";
import { Users, UserRoundPlus, LogIn } from "lucide-react";
import styles from "./CommunityPage.module.css";

interface Props {
  lang: "ar" | "en";
}

const TX = {
  ar: {
    title: "سجّل الدخول لمتابعة المجتمع",
    sub: "المجتمع متاح فقط لأصحاب الحسابات — سجّل دخولك أو أنشئ حساباً لتصفّح الفرص، الأسئلة، والعروض.",
    talent: "إنشاء حساب كموهبة",
    brand: "إنشاء حساب كبراند",
    login: "تسجيل الدخول",
  },
  en: {
    title: "Sign in to view the community",
    sub: "The community is for account holders only — sign in or create an account to browse opportunities, questions, and offers.",
    talent: "Create a Talent account",
    brand: "Create a Brand account",
    login: "Log in",
  },
} as const;

export default function CommunityAuthGate({ lang }: Props) {
  const t = TX[lang];
  const next = "/community";

  return (
    <div className={styles.authGateWrap}>
      <div className={styles.authGateCard}>
        <span className={styles.authGateIcon}><Users size={26} /></span>
        <h2 className={styles.authGateTitle}>{t.title}</h2>
        <p className={styles.authGateSub}>{t.sub}</p>
        <div className={styles.authGateActions}>
          <Link href={`/register?role=talent&next=${encodeURIComponent(next)}`} className={`${styles.button} ${styles.buttonSubmit}`}>
            <UserRoundPlus size={16} />
            {t.talent}
          </Link>
          <Link href={`/register?role=brand&next=${encodeURIComponent(next)}`} className={`${styles.button} ${styles.buttonGhost}`} style={{ color: "var(--color-primary)", background: "var(--color-primary-soft)" }}>
            <UserRoundPlus size={16} />
            {t.brand}
          </Link>
          <Link href={`/login?next=${encodeURIComponent(next)}`} className={`${styles.button} ${styles.buttonCancel}`}>
            <LogIn size={16} />
            {t.login}
          </Link>
        </div>
      </div>
    </div>
  );
}
