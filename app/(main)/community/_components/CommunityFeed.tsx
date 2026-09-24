"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, ArrowRight, ArrowLeft, Check, Pin, MessagesSquare, Briefcase, Sparkles, Users, MessageCircleQuestion } from "lucide-react";
import type { Question } from "./CommunityClient";
import type { FeedItem } from "./types";
import CustomSelect from "@/components/ui/CustomSelect";
import styles from "./CommunityPage.module.css";

const PAGE_SIZE = 5;

export type KindFilter = "all" | "job" | "offer" | "question" | "connected";

interface Props {
  lang: "ar" | "en";
  items: FeedItem[];
  loading: boolean;
  activeTab: "all" | "popular";
  onTabChange: (t: "all" | "popular") => void;
  kindFilter: KindFilter;
  onKindFilterChange: (k: KindFilter) => void;
  /** Profile ids the viewer follows — powers the "Connected" tab. Empty for a guest. */
  connectedIds: Set<string>;
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
  onRequireAuth: () => void;
  onApplyJob: (job: Extract<FeedItem, { kind: "job" }>["job"]) => void;
  onApplyOffer: (offer: Extract<FeedItem, { kind: "offer" }>["offer"]) => void;
  onManageApplicants: (kind: "job" | "offer", id: string, title: string) => void;
}

const TX = {
  ar: {
    forYou: "لك", opportunities: "فرص", offers: "عروض", questions: "أسئلة", connected: "متصل بهم",
    sortRecent: "الأحدث", sortPopular: "الأكثر تفاعلاً",
    search: "ابحث عن سؤال، فرصة، أو عرض...",
    allTags: "كل الوسوم", comments: "تعليقات", views: "مشاهدة",
    brand: "براند", talent: "موهبة", pinned: "مثبّت", viewAll: "عرض الكل",
    viewAnswers: "عرض الإجابات", hideAnswers: "إخفاء الإجابات", answers: "الإجابات", openQuestion: "فتح السؤال كاملاً",
    addComment: "أضف تعليقك...", loginToComment: "سجّل الدخول لإضافة تعليق",
    noQuestions: "لا يوجد شيء مطابق", noQuestionsSub: "جرّب تغيير البحث أو الوسم، أو كن أول من ينشر.",
    jobLabel: "فرصة", offerLabel: "عرض خاص", questionLabel: "سؤال", budget: "الميزانية", negotiable: "يُتفق عليه",
    apply: "قدّم الآن", manage: "إدارة المتقدمين", slots: "مكان",
  },
  en: {
    forYou: "For You", opportunities: "Opportunities", offers: "Offers", questions: "Questions", connected: "Connected",
    sortRecent: "Most recent", sortPopular: "Most active",
    search: "Search a question, opportunity, or offer...",
    allTags: "All tags", comments: "comments", views: "views",
    brand: "Brand", talent: "Talent", pinned: "Pinned", viewAll: "View all",
    viewAnswers: "View answers", hideAnswers: "Hide answers", answers: "Answers", openQuestion: "Open full question",
    addComment: "Add your comment...", loginToComment: "Log in to comment",
    noQuestions: "Nothing matches", noQuestionsSub: "Try a different search or tag — or be the first to post.",
    jobLabel: "Opportunity", offerLabel: "Special offer", questionLabel: "Question", budget: "Budget", negotiable: "Negotiable",
    apply: "Apply now", manage: "Manage applicants", slots: "slot",
  },
} as const;

function formatBudget(min: number | null, max: number | null, currency: string, negotiableLabel: string) {
  if (!min && !max) return negotiableLabel;
  if (min && max && min !== max) return `${min.toLocaleString()}–${max.toLocaleString()} ${currency}`;
  return `${(max ?? min)!.toLocaleString()} ${currency}`;
}

function authorIdOf(item: FeedItem): string {
  if (item.kind === "question") return item.question.user_id;
  if (item.kind === "job") return item.job.brand_id;
  return item.offer.user_id;
}

function offerCountdown(iso: string, ar: boolean): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return ar ? "منتهي" : "ended";
  const hours = Math.floor(ms / 3_600_000);
  const label = ar ? "ينتهي خلال" : "Ends in";
  if (hours < 24) return `${label} ${hours}${ar ? "س" : "h"}`;
  const days = Math.floor(hours / 24);
  return `${label} ${days}${ar ? "ي" : "d"} ${hours % 24}${ar ? "س" : "h"}`;
}

export default function CommunityFeed({
  lang, items, loading, activeTab, onTabChange, kindFilter, onKindFilterChange, connectedIds, search, onSearch,
  popularTags, activeTag, onTagChange, user,
  commentInput, onCommentInput, submittingComment, onSubmitComment, onRequireAuth,
  onApplyJob, onApplyOffer, onManageApplicants,
}: Props) {
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  useEffect(() => { setPage(1); }, [activeTab, kindFilter, search, activeTag]);

  const filteredItems = kindFilter === "all"
    ? items
    : kindFilter === "connected"
      ? items.filter((i) => connectedIds.has(authorIdOf(i)))
      : items.filter((i) => i.kind === kindFilter);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goTo = (p: number) => {
    setPage(p);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(ar ? "ar-EG" : "en-US");

  function renderQuestionCard(q: Question) {
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
                <span className={`${styles.typeBadge} ${styles.typeBadgeQuestion}`}><MessageCircleQuestion size={11} />{t.questionLabel}</span>
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
                  <button type="button" className={styles.viewAll} onClick={() => toggleExpand(q.id)} aria-expanded={isOpen}>
                    {isOpen ? t.hideAnswers : `${t.viewAnswers} (${answers.length})`}
                  </button>
                )}

                {isOpen && (
                  <button type="button" className={styles.viewAll} onClick={() => router.push(`/community/question/${q.id}`)}>
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
              <button type="button" className={styles.sendButton} onClick={() => onSubmitComment(q.id)}
                disabled={submittingComment[q.id] || !commentInput[q.id]?.trim()} aria-label={t.addComment}>
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
  }

  function renderJobCard(job: Extract<FeedItem, { kind: "job" }>["job"]) {
    const isOwner = user?.id === job.brand_id;
    return (
      <article key={`job-${job.id}`} className={styles.questionCard}>
        <div className={styles.qHead}>
          <div className={styles.qMain}>
            <div className={styles.avatar}>
              <img
                src={job.brand?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${job.brand?.full_name}`}
                alt={job.brand?.full_name ?? ""}
                loading="lazy"
              />
            </div>
            <div className={styles.qBody}>
              <div className={styles.qMeta}>
                <span className={styles.qAuthor}>{job.brand?.full_name}</span>
                <span className={`${styles.typeBadge} ${styles.typeBadgeJob}`}><Briefcase size={11} />{t.jobLabel}</span>
                <span className={styles.qDate}>{formatDate(job.created_at)}</span>
              </div>
              <h3 className={styles.qTitle}>{job.title}</h3>
              {job.description && <p className={styles.qExcerpt}>{job.description}</p>}
              <div className={styles.postMetaRow}>
                <span className={styles.postMetaItem}>
                  {t.budget}: <span className={styles.postPrice}>{formatBudget(job.budget_min, job.budget_max, job.currency, t.negotiable)}</span>
                </span>
                {job.category && <span className={styles.postMetaItem}>{job.category}</span>}
                <span className={styles.slotsChip}><Users size={11} />{job.slots} {t.slots}</span>
              </div>
              <div className={styles.postActionsRow}>
                {isOwner ? (
                  <button type="button" className={`${styles.postActionBtn} ${styles.postActionBtnPrimary}`} onClick={() => onManageApplicants("job", job.id, job.title)}>
                    {t.manage}
                  </button>
                ) : (
                  <button type="button" className={`${styles.postActionBtn} ${styles.postActionBtnPrimary}`} onClick={() => onApplyJob(job)}>
                    {t.apply}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  function renderOfferCard(offer: Extract<FeedItem, { kind: "offer" }>["offer"]) {
    const isOwner = user?.id === offer.user_id;
    return (
      <article key={`offer-${offer.id}`} className={styles.questionCard}>
        <div className={styles.qHead}>
          <div className={styles.qMain}>
            <div className={styles.avatar}>
              <img
                src={offer.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${offer.author?.full_name}`}
                alt={offer.author?.full_name ?? ""}
                loading="lazy"
              />
            </div>
            <div className={styles.qBody}>
              <div className={styles.qMeta}>
                <span className={styles.qAuthor}>{offer.author?.full_name}</span>
                <span className={`${styles.typeBadge} ${styles.typeBadgeOffer}`}><Sparkles size={11} />{t.offerLabel}</span>
                {offer.expires_at && (
                  <span className={styles.endingCountdown}>{offerCountdown(offer.expires_at, ar)}</span>
                )}
                <span className={styles.qDate}>{formatDate(offer.created_at)}</span>
              </div>

              <div className={styles.cardMediaRow}>
                <div className={styles.cardMediaBody}>
                  <h3 className={styles.qTitle}>{offer.title}</h3>
                  {offer.content && <p className={styles.qExcerpt}>{offer.content}</p>}
                  <div className={styles.postMetaRow}>
                    <span className={styles.postPrice}>{offer.price ? `${offer.price.toLocaleString()} EGP` : t.negotiable}</span>
                    {offer.category && <span className={styles.postMetaItem}>{offer.category}</span>}
                  </div>
                </div>
                {offer.media_url && (
                  <img className={styles.cardThumb} src={offer.media_url} alt="" loading="lazy" />
                )}
              </div>

              <div className={styles.postActionsRow}>
                {isOwner ? (
                  <button type="button" className={`${styles.postActionBtn} ${styles.postActionBtnPrimary}`} onClick={() => onManageApplicants("offer", offer.id, offer.title)}>
                    {t.manage}
                  </button>
                ) : (
                  <button type="button" className={`${styles.postActionBtn} ${styles.postActionBtnPrimary}`} onClick={() => onApplyOffer(offer)}>
                    {t.apply}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  const kindTabs: { key: KindFilter; label: string }[] = [
    { key: "all", label: t.forYou },
    { key: "job", label: t.opportunities },
    { key: "offer", label: t.offers },
    { key: "question", label: t.questions },
    // Only meaningful once the viewer follows someone — a guest or a
    // brand-new account would just see an empty tab forever.
    ...(user && connectedIds.size > 0 ? [{ key: "connected" as const, label: t.connected }] : []),
  ];

  return (
    <div>
      {/* Content-kind tabs */}
      <div className={styles.kindTabs}>
        {kindTabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`${styles.kindTab} ${kindFilter === key ? styles.kindTabActive : ""}`}
            onClick={() => onKindFilterChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={`${styles.toolbarRight} ${styles.toolbarRightFull}`}>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input type="text" placeholder={t.search} value={search} onChange={(e) => onSearch(e.target.value)} />
          </div>
          <div className={styles.sortSelectWrap}>
            <CustomSelect
              value={activeTab}
              onChange={(v) => onTabChange(v as "all" | "popular")}
              options={[
                { value: "all", label: t.sortRecent },
                { value: "popular", label: t.sortPopular },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Tag filter */}
      {popularTags.length > 0 && (
        <div className={styles.tagFilter}>
          <button type="button" className={`${styles.tagChip} ${activeTag === null ? styles.tagChipActive : ""}`} onClick={() => onTagChange(null)}>
            {t.allTags}
          </button>
          {popularTags.map((tag) => (
            <button key={tag} type="button" className={`${styles.tagChip} ${activeTag === tag ? styles.tagChipActive : ""}`} onClick={() => onTagChange(activeTag === tag ? null : tag)}>
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
      ) : filteredItems.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}><MessagesSquare size={26} /></span>
          <p className={styles.emptyTitle}>{t.noQuestions}</p>
          <p className={styles.emptyText}>{t.noQuestionsSub}</p>
        </div>
      ) : (
        <div className={styles.feed}>
          {pageItems.map((item) =>
            item.kind === "question" ? renderQuestionCard(item.question)
            : item.kind === "job" ? renderJobCard(item.job)
            : renderOfferCard(item.offer)
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button type="button" className={styles.pageBtn} onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}>
                {ar ? "السابق" : "Prev"}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} type="button" className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ""}`} onClick={() => goTo(p)}>
                  {p}
                </button>
              ))}
              <button type="button" className={styles.pageBtn} onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}>
                {ar ? "التالي" : "Next"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
