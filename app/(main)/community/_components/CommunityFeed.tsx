"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Eye, ArrowRight, ArrowLeft, Check, Pin, MessagesSquare } from "lucide-react";
import type { Question } from "./CommunityClient";
import styles from "./CommunityPage.module.css";

const PAGE_SIZE = 3;

interface Props {
  lang: "ar" | "en";
  questions: Question[];
  loading: boolean;
  activeTab: "all" | "popular";
  onTabChange: (t: "all" | "popular") => void;
  search: string;
  onSearch: (v: string) => void;
  popularTags: string[];
  activeTag: string | null;
  onTagChange: (t: string | null) => void;
  user: { id: string } | null;
  commentInput: Record<string, string>;
  onCommentInput: (id: string, v: string) => void;
  submittingComment: Record<string, boolean>;
  onSubmitComment: (id: string) => void;
  onAsk: () => void;
  onRequireAuth: () => void;
}

const TX = {
  ar: {
    all: "كل الأسئلة", popular: "الأكثر تفاعلاً", search: "ابحث عن سؤال أو تاق...",
    ask: "اسأل سؤالاً", allTags: "كل الوسوم", comments: "تعليقات", views: "مشاهدة",
    brand: "براند", talent: "موهبة", pinned: "مثبّت", viewAll: "عرض الكل",
    viewAnswers: "عرض الإجابات", hideAnswers: "إخفاء الإجابات", answers: "الإجابات", openQuestion: "فتح السؤال كاملاً",
    addComment: "أضف تعليقك...", loginToComment: "سجّل الدخول لإضافة تعليق",
    noQuestions: "لا توجد أسئلة مطابقة", noQuestionsSub: "جرّب تغيير البحث أو الوسم، أو كن أول من يسأل.",
  },
  en: {
    all: "All questions", popular: "Most active", search: "Search a question or tag...",
    ask: "Ask a question", allTags: "All tags", comments: "comments", views: "views",
    brand: "Brand", talent: "Talent", pinned: "Pinned", viewAll: "View all",
    viewAnswers: "View answers", hideAnswers: "Hide answers", answers: "Answers", openQuestion: "Open full question",
    addComment: "Add your comment...", loginToComment: "Log in to comment",
    noQuestions: "No matching questions", noQuestionsSub: "Try a different search or tag — or be the first to ask.",
  },
} as const;

export default function CommunityFeed({
  lang, questions, loading, activeTab, onTabChange, search, onSearch,
  popularTags, activeTag, onTagChange, user,
  commentInput, onCommentInput, submittingComment, onSubmitComment, onAsk, onRequireAuth,
}: Props) {
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  // Reset to the first page whenever the result set changes.
  useEffect(() => { setPage(1); }, [activeTab, search, activeTag]);

  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageQuestions = questions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goTo = (p: number) => {
    setPage(p);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(ar ? "ar-EG" : "en-US");

  return (
    <div>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
            onClick={() => onTabChange("all")}
          >
            {t.all}
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "popular" ? styles.tabActive : ""}`}
            onClick={() => onTabChange("popular")}
          >
            {t.popular}
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <button type="button" className={styles.askButton} onClick={onAsk}>
            <Plus size={16} />
            {t.ask}
          </button>
        </div>
      </div>

      {/* Tag filter */}
      {popularTags.length > 0 && (
        <div className={styles.tagFilter}>
          <button
            type="button"
            className={`${styles.tagChip} ${activeTag === null ? styles.tagChipActive : ""}`}
            onClick={() => onTagChange(null)}
          >
            {t.allTags}
          </button>
          {popularTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`${styles.tagChip} ${activeTag === tag ? styles.tagChipActive : ""}`}
              onClick={() => onTagChange(activeTag === tag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className={styles.feed}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : questions.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}><MessagesSquare size={26} /></span>
          <p className={styles.emptyTitle}>{t.noQuestions}</p>
          <p className={styles.emptyText}>{t.noQuestionsSub}</p>
        </div>
      ) : (
        <div className={styles.feed}>
          {pageQuestions.map((q) => {
            const isBrand = q.profiles?.role === "brand";
            const answers = q.community_answers ?? [];
            return (
              <article key={q.id} className={styles.questionCard}>
                <div className={styles.qHead} onClick={() => router.push(`/community/question/${q.id}`)}>
                  <div className={styles.qMain}>
                    <div className={styles.avatar}>
                      <img
                        src={q.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${q.profiles?.full_name}`}
                        alt={q.profiles?.full_name}
                        loading="lazy"
                      />
                      {q.profiles?.is_verified && (
                        <span className={styles.avatarVerified}><Check size={9} strokeWidth={3.5} /></span>
                      )}
                    </div>

                    <div className={styles.qBody}>
                      <div className={styles.qMeta}>
                        <span className={styles.qAuthor}>{q.profiles?.full_name}</span>
                        <span className={`${styles.roleBadge} ${isBrand ? styles.roleBrand : styles.roleTalent}`}>
                          {isBrand ? t.brand : t.talent}
                        </span>
                        {q.status === "pinned" && (
                          <span className={styles.pinnedBadge}><Pin size={10} />{t.pinned}</span>
                        )}
                        <span className={styles.qDate}>{formatDate(q.created_at)}</span>
                      </div>

                      <h3 className={styles.qTitle}>{q.title}</h3>
                      <p className={styles.qExcerpt}>{q.content}</p>

                      {q.tags?.length > 0 && (
                        <div className={styles.tagRow}>
                          {q.tags.map((tag, i) => (
                            <span key={`${tag}-${i}`} className={styles.tag}>#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.qStats}>
                    <div className={styles.answerCount}>
                      <span className={styles.answerCountValue}>{answers.length}</span>
                      <span className={styles.answerCountLabel}>{t.comments}</span>
                    </div>
                    <span className={styles.viewsMeta}>
                      <Eye size={13} />{q.views} {t.views}
                    </span>
                  </div>
                </div>

                <div className={styles.qFooter}>
                  {(() => {
                    const isOpen = !!expanded[q.id];
                    const shown = isOpen ? answers : answers.slice(0, 2);
                    return (
                      <>
                        {isOpen && answers.length > 0 && (
                          <p className={styles.answersDivider}>{t.answers} ({answers.length})</p>
                        )}
                        {shown.map((c, cIdx) => (
                          <div key={c.id ?? cIdx} className={styles.commentPreview}>
                            <img
                              src={c.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.profiles?.full_name}`}
                              alt={c.profiles?.full_name}
                              loading="lazy"
                            />
                            <div>
                              <div className={styles.commentAuthor}>{c.profiles?.full_name}</div>
                              <div className={isOpen ? styles.commentTextFull : styles.commentText}>{c.content}</div>
                              {isOpen && c.created_at && (
                                <div className={styles.commentDate}>{formatDate(c.created_at)}</div>
                              )}
                            </div>
                          </div>
                        ))}

                        {answers.length > 2 && (
                          <button
                            type="button"
                            className={styles.viewAll}
                            onClick={() => toggleExpand(q.id)}
                            aria-expanded={isOpen}
                          >
                            {isOpen ? t.hideAnswers : `${t.viewAnswers} (${answers.length})`}
                          </button>
                        )}

                        {isOpen && (
                          <button
                            type="button"
                            className={styles.viewAll}
                            onClick={() => router.push(`/community/question/${q.id}`)}
                          >
                            {t.openQuestion} →
                          </button>
                        )}
                      </>
                    );
                  })()}

                  {user ? (
                    <div className={styles.commentBar}>
                      <input
                        type="text"
                        placeholder={t.addComment}
                        value={commentInput[q.id] || ""}
                        onChange={(e) => onCommentInput(q.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") onSubmitComment(q.id); }}
                      />
                      <button
                        type="button"
                        className={styles.sendButton}
                        onClick={() => onSubmitComment(q.id)}
                        disabled={submittingComment[q.id] || !commentInput[q.id]?.trim()}
                        aria-label={t.addComment}
                      >
                        <Arrow size={16} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" className={styles.loginPrompt} onClick={onRequireAuth}>
                      {t.loginToComment}
                    </button>
                  )}
                </div>
              </article>
            );
          })}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => goTo(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {ar ? "السابق" : "Prev"}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ""}`}
                  onClick={() => goTo(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => goTo(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                {ar ? "التالي" : "Next"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
