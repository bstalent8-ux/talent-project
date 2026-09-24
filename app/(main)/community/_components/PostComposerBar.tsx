"use client";
import { Image as ImageIcon, Briefcase, MessageCircleQuestion, Sparkles, UserPen } from "lucide-react";
import { cdnImage } from "@/lib/images";
import type { PostType } from "./PostTypeMenu";
import styles from "./CommunityPage.module.css";

interface Props {
  lang: "ar" | "en";
  userId: string | null;
  avatarUrl: string | null;
  role: string | null;
  onPick: (type: PostType) => void;
}

const TX = {
  ar: {
    placeholder: "شارك تحديثاً، عملك، سؤالاً، أو فرصة...",
    work: "عملي", opportunity: "فرصة", question: "سؤال", offer: "عرض",
  },
  en: {
    placeholder: "Share an update, your work, a question or an opportunity...",
    work: "Work", opportunity: "Opportunity", question: "Question", offer: "Offer",
  },
} as const;

export default function PostComposerBar({ lang, userId, avatarUrl, role, onPick }: Props) {
  const t = TX[lang];

  // Guests still see the whole bar — clicking any action routes through the
  // same requestAuth() flow every other guarded control on this page uses.
  const showOpportunity = role === null || role === "brand" || role === "admin";
  const showOffer = role === null || role === "talent" || role === "admin";

  return (
    <div className={styles.composerBar}>
      <div className={styles.composerTop}>
        {avatarUrl ? (
          <img className={styles.composerAvatar} src={cdnImage(avatarUrl, 52)} alt="" />
        ) : (
          <span className={styles.composerAvatarFallback}><UserPen size={16} aria-hidden="true" /></span>
        )}
        <button type="button" className={styles.composerInput} onClick={() => onPick("question")}>
          {t.placeholder}
        </button>
      </div>
      <div className={styles.composerActions}>
        <button type="button" className={styles.composerActionBtn} onClick={() => onPick("story")}>
          <ImageIcon size={15} />
          {t.work}
        </button>
        {showOpportunity && (
          <button type="button" className={styles.composerActionBtn} onClick={() => onPick("job")}>
            <Briefcase size={15} />
            {t.opportunity}
          </button>
        )}
        <button type="button" className={styles.composerActionBtn} onClick={() => onPick("question")}>
          <MessageCircleQuestion size={15} />
          {t.question}
        </button>
        {showOffer && (
          <button type="button" className={styles.composerActionBtn} onClick={() => onPick("offer")}>
            <Sparkles size={15} />
            {t.offer}
          </button>
        )}
      </div>
    </div>
  );
}
