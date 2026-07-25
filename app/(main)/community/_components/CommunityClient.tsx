"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, MessagesSquare, Handshake, Lightbulb, X, type LucideIcon } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { createClient } from "@/lib/supabase/client";
import CommunityHero from "./CommunityHero";
import CommunityFeed from "./CommunityFeed";
import styles from "./CommunityPage.module.css";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  is_verified: boolean;
}

export interface Answer {
  id: string;
  content: string;
  created_at: string;
  profiles: Profile;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[];
  views: number;
  status: string;
  created_at: string;
  user_id: string;
  profiles: Profile;
  community_answers: Answer[];
}

const TX = {
  ar: {
    modalTitle: "اطرح سؤالاً",
    fTitle: "العنوان",
    fContent: "المحتوى",
    fTags: "التاقات (افصل بينها بفاصلة)",
    submit: "نشر السؤال",
    cancel: "إلغاء",
    guideKicker: "إرشادات المجتمع",
    guideTitle: "مساحة محترمة تبني الثقة",
    ctaTitle: "لديك خبرة تستحق أن تُشارك؟",
    ctaSub: "ساعد غيرك بإجابة، أو اطرح سؤالك وستجد من يرد عليك من خبراء الصناعة.",
    ctaAsk: "اطرح سؤالاً",
    ctaExplore: "تصفّح المواهب",
  },
  en: {
    modalTitle: "Ask a question",
    fTitle: "Title",
    fContent: "Content",
    fTags: "Tags (separate with commas)",
    submit: "Post question",
    cancel: "Cancel",
    guideKicker: "Community guidelines",
    guideTitle: "A respectful space that builds trust",
    ctaTitle: "Have expertise worth sharing?",
    ctaSub: "Help others with an answer, or ask your question and get replies from industry experts.",
    ctaAsk: "Ask a question",
    ctaExplore: "Browse talent",
  },
} as const;

export default function CommunityClient() {
  const { lang } = useSite();
  const ar = lang === "ar";
  const t = TX[lang];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "popular">("all");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: "", content: "", tags: "" });
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [statsLoaded, setStatsLoaded] = useState<Question[] | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const sort = activeTab === "popular" ? "popular" : "recent";
      const res = await fetch(`/api/community/questions?sort=${sort}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        setStatsLoaded((prev) => prev ?? data.questions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ? { id: user.id } : null);
    })();
  }, [supabase]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const openAsk = () => (user ? setShowModal(true) : router.push("/login"));

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    try {
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newQuestion.title,
          content: newQuestion.content,
          tags: newQuestion.tags.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setNewQuestion({ title: "", content: "", tags: "" });
        fetchQuestions();
      } else {
        alert(ar ? `خطأ: ${data.error || "حدث خطأ غير معروف"}` : `Error: ${data.error || "Unknown error"}`);
      }
    } catch {
      alert(ar ? "فشل الاتصال بالسيرفر" : "Server connection failed");
    }
  };

  const handleSubmitComment = async (questionId: string) => {
    const content = commentInput[questionId]?.trim();
    if (!content) return;
    if (!user) { router.push("/login"); return; }
    setSubmittingComment((p) => ({ ...p, [questionId]: true }));
    try {
      const res = await fetch("/api/community/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: questionId, content }),
      });
      if (res.ok) {
        setCommentInput((p) => ({ ...p, [questionId]: "" }));
        fetchQuestions();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmittingComment((p) => ({ ...p, [questionId]: false }));
    }
  };

  // ── Popular tags (from first loaded snapshot) ──────────
  const popularTags = useMemo(() => {
    const source = statsLoaded ?? questions;
    const freq = new Map<string, number>();
    source.forEach((q) => q.tags?.forEach((tag) => freq.set(tag, (freq.get(tag) ?? 0) + 1)));
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag]) => tag);
  }, [statsLoaded, questions]);

  const visibleQuestions = useMemo(
    () => (activeTag ? questions.filter((q) => q.tags?.includes(activeTag)) : questions),
    [questions, activeTag],
  );

  // ── Hero stats (snapshot from first load) ──────────────
  const heroStats = useMemo(() => {
    const src = statsLoaded ?? [];
    const answers = src.reduce((s, q) => s + (q.community_answers?.length ?? 0), 0);
    const contributors = new Set(src.map((q) => q.profiles?.id).filter(Boolean)).size;
    return [
      { value: src.length ? `${src.length}+` : "—", label: ar ? "سؤال منشور" : "Questions" },
      { value: answers ? `${answers}+` : "—", label: ar ? "إجابة ونصيحة" : "Answers & tips" },
      { value: contributors ? `${contributors}+` : "—", label: ar ? "مشارك نشط" : "Contributors" },
      { value: "24/7", label: ar ? "مجتمع نشط" : "Active community" },
    ];
  }, [statsLoaded, ar]);

  const features: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: ShieldCheck, title: ar ? "محتوى موثوق" : "Trusted content",
      text: ar ? "أسئلة وإجابات من مواهب وبراندات حقيقية على المنصة." : "Questions and answers from real talents and brands on the platform." },
    { icon: MessagesSquare, title: ar ? "نقاش محترم" : "Respectful discussion",
      text: ar ? "حافظ على لغة مهنية ومحترمة تجاه جميع الأعضاء." : "Keep it professional and respectful toward every member." },
    { icon: Handshake, title: ar ? "شراكات حقيقية" : "Real partnerships",
      text: ar ? "حوّل النقاش إلى تعاون فعلي بين المواهب والبراندات." : "Turn discussion into real collaboration between talent and brands." },
    { icon: Lightbulb, title: ar ? "شارك خبرتك" : "Share your expertise",
      text: ar ? "إجابة واحدة مفيدة قد تبني سمعتك أمام آلاف الأعضاء." : "One helpful answer can build your reputation with thousands." },
  ];

  return (
    <div className={styles.page}>
      <CommunityHero lang={lang} stats={heroStats} onAsk={openAsk} />

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderText}>
              <p className={styles.sectionKicker}>{ar ? "أحدث النقاشات" : "Latest discussions"}</p>
              <h2 className={styles.sectionTitle}>{ar ? "أسئلة وأجوبة المجتمع" : "Community questions & answers"}</h2>
              <p className={styles.sectionDescription}>
                {ar
                  ? "تصفّح أحدث الأسئلة، صفِّ حسب الوسم، أو شارك بإجابتك — كل الخبرة في مكان واحد."
                  : "Browse the latest questions, filter by tag, or jump in with an answer — all the expertise in one place."}
              </p>
            </div>
          </div>

          <CommunityFeed
            lang={lang}
            questions={visibleQuestions}
            loading={loading}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            search={search}
            onSearch={setSearch}
            popularTags={popularTags}
            activeTag={activeTag}
            onTagChange={setActiveTag}
            user={user}
            commentInput={commentInput}
            onCommentInput={(id, v) => setCommentInput((p) => ({ ...p, [id]: v }))}
            submittingComment={submittingComment}
            onSubmitComment={handleSubmitComment}
            onAsk={openAsk}
          />
        </div>
      </section>

      {/* Guidelines / features band */}
      <section className={`${styles.section} ${styles.featureBand}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderText}>
              <p className={styles.sectionKicker}>{t.guideKicker}</p>
              <h2 className={styles.sectionTitle}>{t.guideTitle}</h2>
            </div>
          </div>
          <div className={styles.featureGrid}>
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={styles.featureCard}>
                  <span className={styles.featureIcon}><Icon size={22} /></span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaSub}</p>
          <div className={styles.heroActions}>
            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={openAsk}>
              {t.ctaAsk}
            </button>
            <Link href="/explore" className={`${styles.button} ${styles.buttonGhost}`}>
              {t.ctaExplore}
            </Link>
          </div>
        </div>
      </section>

      {/* Ask modal */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{t.modalTitle}</h2>
            <form className={styles.form} onSubmit={handleSubmitQuestion}>
              <div className={styles.field}>
                <label htmlFor="q-title">{t.fTitle}</label>
                <input
                  id="q-title" required
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-content">{t.fContent}</label>
                <textarea
                  id="q-content" required rows={5}
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-tags">{t.fTags}</label>
                <input
                  id="q-tags" placeholder="marketing, fashion, pricing"
                  value={newQuestion.tags}
                  onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={`${styles.button} ${styles.buttonSubmit}`}>{t.submit}</button>
                <button type="button" className={`${styles.button} ${styles.buttonCancel}`} onClick={() => setShowModal(false)}>
                  <X size={16} />
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
