"use client";
import { MessagesSquare, Plus } from "lucide-react";
import styles from "./CommunityPage.module.css";

interface Props {
  lang: "ar" | "en";
  stats: { value: string; label: string }[];
  onAsk: () => void;
}

const TX = {
  ar: {
    badge: "مجتمع المنصة",
    title: <>اسأل، شارك، وتواصل مع <em>خبراء الصناعة</em></>,
    sub: "المساحة الحرة لتبادل الخبرات، طرح الأسئلة، وتواصل المواهب والبراندات لبناء شراكات أقوى.",
    cta: "اطرح سؤالاً الآن",
  },
  en: {
    badge: "Platform community",
    title: <>Ask, share, and connect with <em>industry experts</em></>,
    sub: "The free space to share experience, ask questions, and connect talents and brands to build stronger partnerships.",
    cta: "Ask a question now",
  },
} as const;

export default function CommunityHero({ lang, stats, onAsk }: Props) {
  const t = TX[lang];

  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} />

      <div className={styles.heroContent}>
        <span className={styles.badge}>
          <MessagesSquare size={14} />
          {t.badge}
        </span>

        <h1 className={styles.heroTitle}>{t.title}</h1>
        <p className={styles.heroSubtitle}>{t.sub}</p>

        <div className={styles.heroActions}>
          <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={onAsk}>
            <Plus size={17} />
            {t.cta}
          </button>
        </div>
      </div>

      <div className={styles.statsStrip}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
