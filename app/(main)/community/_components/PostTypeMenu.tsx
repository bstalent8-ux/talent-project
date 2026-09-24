"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, MessageCircleQuestion, Briefcase, Sparkles, CircleDot } from "lucide-react";
import styles from "./CommunityPage.module.css";

export type PostType = "question" | "job" | "offer" | "story";

interface Props {
  lang: "ar" | "en";
  /** Which options this visitor is allowed to see — a guest still sees the
   *  full menu (picking one triggers the auth modal, same as the old plain
   *  Ask button did), a talent doesn't see "post a job", a brand doesn't
   *  see "post an offer". */
  role: string | null;
  onPick: (type: PostType) => void;
}

const TX = {
  ar: {
    post: "أضف",
    question: "اطرح سؤالاً",
    job: "انشر وظيفة",
    offer: "انشر عرضاً",
    story: "أضف Story",
  },
  en: {
    post: "Post",
    question: "Ask a question",
    job: "Post a job",
    offer: "Post an offer",
    story: "Add a story",
  },
} as const;

export default function PostTypeMenu({ lang, role, onPick }: Props) {
  const t = TX[lang];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // A guest (role === null) still sees every option — picking one is what
  // triggers requestAuth() in the parent, same as the plain "Ask" button did.
  const showJob = role === null || role === "brand" || role === "admin";
  const showOffer = role === null || role === "talent" || role === "admin";

  function pick(type: PostType) {
    setOpen(false);
    onPick(type);
  }

  return (
    <div className={styles.postMenuWrap} ref={ref}>
      <button type="button" className={styles.askButton} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        <Plus size={16} />
        {t.post}
      </button>
      {open && (
        <div className={styles.postMenu} role="menu">
          <button type="button" className={styles.postMenuItem} role="menuitem" onClick={() => pick("question")}>
            <span className={styles.postMenuItemIcon}><MessageCircleQuestion size={14} /></span>
            {t.question}
          </button>
          {showJob && (
            <button type="button" className={styles.postMenuItem} role="menuitem" onClick={() => pick("job")}>
              <span className={styles.postMenuItemIcon}><Briefcase size={14} /></span>
              {t.job}
            </button>
          )}
          {showOffer && (
            <button type="button" className={styles.postMenuItem} role="menuitem" onClick={() => pick("offer")}>
              <span className={styles.postMenuItemIcon}><Sparkles size={14} /></span>
              {t.offer}
            </button>
          )}
          <button type="button" className={styles.postMenuItem} role="menuitem" onClick={() => pick("story")}>
            <span className={styles.postMenuItemIcon}><CircleDot size={14} /></span>
            {t.story}
          </button>
        </div>
      )}
    </div>
  );
}
