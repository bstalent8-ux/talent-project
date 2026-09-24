"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ShieldCheck, MessagesSquare, Handshake, Lightbulb, X, type LucideIcon } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { useMyProfile } from "@/hooks/useMyProfile";
import { canPerformAction } from "@/lib/permissions";
import CommunityFeed, { type KindFilter } from "./CommunityFeed";
import CommunityAuthGate from "./CommunityAuthGate";
import PostComposerModal from "./PostComposerModal";
import PostComposerBar from "./PostComposerBar";
import ProfileSidebar, { type MeSnapshot } from "./ProfileSidebar";
import TrendingSidebar from "./TrendingSidebar";
import OfferApplyModal from "./OfferApplyModal";
import ApplicantsModal from "./ApplicantsModal";
import StoryBar, { type StoryPost } from "./StoryBar";
import PostTypeMenu, { type PostType } from "./PostTypeMenu";
import type { FeedItem, JobPostLite, CommunityOfferPost } from "./types";
import styles from "./CommunityPage.module.css";

// Job apply reuses the exact modal /jobs already ships — same fields, same
// endpoint, same validation. Importing it from its original location rather
// than forking a copy keeps the two in sync automatically.
import JobApplyModal from "@/app/(main)/jobs/_components/ApplyModal";

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
    pageTitle: "المجتمع",
    pageSub: "اكتشف الفرص، شارك عملك، اطرح أسئلتك، وتواصل مع المواهب والبراندات.",
    createLabel: "أضف",
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
    pageTitle: "Community",
    pageSub: "Discover opportunities, share your work, ask questions, and connect with talents and brands.",
    createLabel: "Post",
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
  const { user, requestAuth, loading: authLoading, isGuest } = useGuestGuard();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [jobs, setJobs] = useState<JobPostLite[]>([]);
  const [offers, setOffers] = useState<CommunityOfferPost[]>([]);
  const [stories, setStories] = useState<StoryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "popular">("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: "", content: "", tags: "" });
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [statsLoaded, setStatsLoaded] = useState<Question[] | null>(null);
  const { profile: me } = useMyProfile();
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  const [composerType, setComposerType] = useState<Exclude<PostType, "question"> | null>(null);
  const [applyJobTarget, setApplyJobTarget] = useState<JobPostLite | null>(null);
  const [applyOfferTarget, setApplyOfferTarget] = useState<CommunityOfferPost | null>(null);
  const [applicantsTarget, setApplicantsTarget] = useState<{ kind: "job" | "offer"; id: string; title: string } | null>(null);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);

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

  const fetchJobsAndOffers = useCallback(async () => {
    try {
      const [jobsRes, postsRes] = await Promise.all([
        fetch("/api/jobs?status=open"),
        fetch("/api/community/posts"),
      ]);
      const jobsData = await jobsRes.json().catch(() => ({}));
      const postsData = await postsRes.json().catch(() => ({}));
      setJobs(jobsData.jobs ?? []);
      const allPosts: Array<CommunityOfferPost | StoryPost> = postsData.posts ?? [];
      setOffers(allPosts.filter((p): p is CommunityOfferPost => p.post_type === "offer"));
      setStories(allPosts.filter((p): p is StoryPost => p.post_type === "story"));
    } catch (error) {
      console.error("Error fetching jobs/offers/stories:", error);
    }
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
  useEffect(() => { fetchJobsAndOffers(); }, [fetchJobsAndOffers]);

  // Who the viewer follows — powers the feed's "Connected" tab.
  useEffect(() => {
    if (!user?.id) { setConnectedIds(new Set()); return; }
    let cancelled = false;
    fetch("/api/community/follow?mine=following")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data?.followingIds) setConnectedIds(new Set(data.followingIds)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  const openAsk = () => (
    canPerformAction("create_community_question", user).allowed
      ? setShowModal(true)
      : requestAuth("create_community_question")
  );

  function handlePickPostType(type: PostType) {
    if (type === "question") { openAsk(); return; }
    const actionMap = { job: "create_job", offer: "create_offer", story: "create_story" } as const;
    if (!canPerformAction(actionMap[type], user).allowed) {
      requestAuth(actionMap[type]);
      return;
    }
    setComposerType(type);
  }

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction("create_community_question", user).allowed) {
      requestAuth("create_community_question");
      return;
    }
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
    if (!canPerformAction("create_community_answer", user).allowed) {
      requestAuth("create_community_answer");
      return;
    }
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

  // Same frequency map as popularTags, but with counts — for the sidebar's
  // "Trending" widget, top 5.
  const trendingTagsWithCount = useMemo(() => {
    const source = statsLoaded ?? questions;
    const freq = new Map<string, number>();
    source.forEach((q) => q.tags?.forEach((tag) => freq.set(tag, (freq.get(tag) ?? 0) + 1)));
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count }));
  }, [statsLoaded, questions]);

  // ── Merge questions + jobs + offers into one sortable feed. Search/tag
  //    filtering stays scoped to questions (jobs/offers have their own
  //    fields, matching them against a question-tag filter wouldn't mean
  //    anything) — a job/offer only drops out when a search term is active
  //    and its title/description doesn't match, so the feed doesn't silently
  //    hide real listings while someone's mid-search for something else. ──
  const feedItems = useMemo<FeedItem[]>(() => {
    const q: FeedItem[] = (activeTag ? questions.filter((qq) => qq.tags?.includes(activeTag)) : questions)
      .map((question) => ({ kind: "question" as const, id: question.id, created_at: question.created_at, question }));

    const term = search.trim().toLowerCase();
    const matchesTerm = (...fields: (string | null | undefined)[]) =>
      !term || fields.some((f) => f?.toLowerCase().includes(term));

    const j: FeedItem[] = activeTag ? [] : jobs
      .filter((job) => matchesTerm(job.title, job.description, job.brand?.full_name))
      .map((job) => ({ kind: "job" as const, id: job.id, created_at: job.created_at, job }));

    const o: FeedItem[] = activeTag ? [] : offers
      .filter((offer) => matchesTerm(offer.title, offer.content, offer.author?.full_name))
      .map((offer) => ({ kind: "offer" as const, id: offer.id, created_at: offer.created_at, offer }));

    return [...q, ...j, ...o].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [questions, jobs, offers, activeTag, search]);

  const features: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: ShieldCheck, title: ar ? "محتوى موثوق" : "Trusted content",
      text: ar ? "أسئلة وإجابات من مواهب وبراندات حقيقية على المنصة." : "Questions and answers from real talents and brands on the platform." },
    { icon: MessagesSquare, title: ar ? "نقاش محترم" : "Respectful discussion",
      text: ar ? "حافظ على لغة مهنية ومحترمة تجاه جميع الأعضاء." : "Keep it professional and respectful toward every member." },
    { icon: Handshake, title: ar ? "شراكات حقيقية" : "Real partnerships",
      text: ar ? "حوّل النقاش إلى تعاون فعلي بين المواهب والبراندات." : "Turn discussion into real collaboration between talent and brands." },
    { icon: Lightbulb, title: ar ? "شارك خبرتك" : "Share your expertise",
      text: ar ? "إجابة واحدة مفيدة قد تبني سمعتك أمام أعضاء المجتمع." : "One helpful answer can build your reputation with the community." },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderText}>
          <h1 className={styles.pageHeaderTitle}>{t.pageTitle}</h1>
          <p className={styles.pageHeaderSub}>{t.pageSub}</p>
        </div>
        {!authLoading && !isGuest && (
          <PostTypeMenu lang={lang} role={user?.role ?? null} onPick={handlePickPostType} />
        )}
      </div>

      {!authLoading && isGuest ? (
        <CommunityAuthGate lang={lang} />
      ) : authLoading ? null : (
      <div className={styles.layout}>
        <aside className={styles.sidebarCol}>
          <ProfileSidebar lang={lang} userId={user?.id ?? null} me={me} onGuestCta={openAsk} />
        </aside>

        <div className={styles.layoutMain}>
          <StoryBar
            lang={lang}
            stories={stories}
            canPost={canPerformAction("create_story", user).allowed}
            onAdd={() => handlePickPostType("story")}
          />

          <PostComposerBar lang={lang} userId={user?.id ?? null} avatarUrl={me?.avatar_url ?? null} role={user?.role ?? null} onPick={handlePickPostType} />

          <CommunityFeed
            lang={lang}
            items={feedItems}
            loading={loading}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            kindFilter={kindFilter}
            onKindFilterChange={setKindFilter}
            connectedIds={connectedIds}
            search={search}
            onSearch={setSearch}
            popularTags={popularTags}
            activeTag={activeTag}
            onTagChange={setActiveTag}
            user={user?.id ? { id: user.id } : null}
            commentInput={commentInput}
            onCommentInput={(id, v) => setCommentInput((p) => ({ ...p, [id]: v }))}
            submittingComment={submittingComment}
            onSubmitComment={handleSubmitComment}
            onRequireAuth={() => requestAuth("create_community_answer")}
            onApplyJob={setApplyJobTarget}
            onApplyOffer={setApplyOfferTarget}
            onManageApplicants={(kind, id, title) => setApplicantsTarget({ kind, id, title })}
          />
        </div>

        <aside className={styles.sidebarCol}>
          <TrendingSidebar
            lang={lang}
            trendingTags={trendingTagsWithCount}
            offers={offers}
            onTagClick={(tag) => setActiveTag((p) => (p === tag ? null : tag))}
            viewerId={user?.id ?? null}
            onRequireAuth={() => requestAuth("create_community_question")}
          />
        </aside>
      </div>
      )}

      {/* Guidelines / features band — hidden behind the auth gate too, the
          "Ask a question" CTA in here would just re-trigger sign-up. */}
      {!authLoading && !isGuest && (
      <>
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
      </>
      )}

      {/* Ask modal */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{t.modalTitle}</h2>
            <form className={styles.form} onSubmit={handleSubmitQuestion}>
              <div className={styles.field}>
                <label htmlFor="q-title">{t.fTitle}</label>
                <input id="q-title" required value={newQuestion.title} onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-content">{t.fContent}</label>
                <textarea id="q-content" required rows={5} value={newQuestion.content} onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="q-tags">{t.fTags}</label>
                <input id="q-tags" placeholder="marketing, fashion, pricing" value={newQuestion.tags} onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })} />
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

      {/* Job / offer / story composer */}
      {composerType && (
        <PostComposerModal
          type={composerType}
          lang={lang}
          onClose={() => setComposerType(null)}
          onSuccess={() => { setComposerType(null); fetchJobsAndOffers(); }}
        />
      )}

      {/* Apply to a job */}
      {applyJobTarget && (
        <JobApplyModal
          job={{
            id: applyJobTarget.id, brand_id: applyJobTarget.brand_id, title: applyJobTarget.title,
            description: applyJobTarget.description, category: applyJobTarget.category,
            budget_min: applyJobTarget.budget_min, budget_max: applyJobTarget.budget_max,
            currency: applyJobTarget.currency, start_date: null, end_date: null,
            slots: applyJobTarget.slots, status: applyJobTarget.status, created_at: applyJobTarget.created_at,
            brand: applyJobTarget.brand,
          }}
          lang={lang}
          onClose={() => setApplyJobTarget(null)}
          onSuccess={() => { setApplyJobTarget(null); setApplySuccessMsg(ar ? "تم إرسال عرضك ✓" : "Your proposal was sent ✓"); }}
        />
      )}

      {/* Apply to an offer */}
      {applyOfferTarget && (
        <OfferApplyModal
          postId={applyOfferTarget.id}
          postTitle={applyOfferTarget.title}
          price={applyOfferTarget.price}
          lang={lang}
          onClose={() => setApplyOfferTarget(null)}
          onSuccess={() => { setApplyOfferTarget(null); setApplySuccessMsg(ar ? "تم إرسال طلبك ✓" : "Your request was sent ✓"); }}
        />
      )}

      {/* Manage applicants (job or offer) */}
      {applicantsTarget && (
        <ApplicantsModal
          kind={applicantsTarget.kind}
          postId={applicantsTarget.id}
          postTitle={applicantsTarget.title}
          lang={lang}
          onClose={() => setApplicantsTarget(null)}
          onChanged={fetchJobsAndOffers}
        />
      )}

      {applySuccessMsg && (
        <div className={styles.modalBackdrop} onClick={() => setApplySuccessMsg(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <p style={{ color: "var(--color-primary)", fontSize: "var(--text-lg)", fontWeight: 900, margin: "0 0 1rem" }}>{applySuccessMsg}</p>
            <button type="button" className={`${styles.button} ${styles.buttonSubmit}`} onClick={() => setApplySuccessMsg(null)} style={{ width: "100%" }}>
              {ar ? "تمام" : "OK"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
