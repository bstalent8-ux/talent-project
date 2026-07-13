"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  is_verified: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: Profile;
}

interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[];
  views: number;
  status: string;
  created_at: string;
  user_id: string;
  profiles: Profile;
  community_answers: Comment[];
}

interface Props {
  dark: boolean;
  lang: "ar" | "en";
}

const TX = {
  ar: {
    all: "كل الأسئلة",
    popular: "الأكثر تفاعلاً",
    search: "ابحث عن سؤال أو تاق...",
    comments: "تعليقات",
    views: "مشاهدة",
    brand: "براند",
    talent: "موهبة",
    pinned: "مُثبت",
    askQuestion: "اسأل سؤالاً",
    title: "العنوان",
    content: "المحتوى",
    tags: "التاقات (افصل بينها بفاصلة)",
    submit: "نشر السؤال",
    cancel: "إلغاء",
    loading: "جاري التحميل...",
    noQuestions: "لا توجد أسئلة بعد.",
    addComment: "أضف تعليقك...",
    send: "إرسال",
    loginToComment: "سجل الدخول لإضافة تعليق",
    viewAll: "عرض الكل",
  },
  en: {
    all: "All Questions",
    popular: "Most Active",
    search: "Search for a question or tag...",
    comments: "Comments",
    views: "views",
    brand: "Brand",
    talent: "Talent",
    pinned: "Pinned",
    askQuestion: "Ask a Question",
    title: "Title",
    content: "Content",
    tags: "Tags (separate by comma)",
    submit: "Post Question",
    cancel: "Cancel",
    loading: "Loading...",
    noQuestions: "No questions found.",
    addComment: "Add your comment...",
    send: "Send",
    loginToComment: "Login to comment",
    viewAll: "View All",
  }
};

export default function CommunityFeed({ dark, lang }: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: "", content: "", tags: "" });
  const [user, setUser] = useState<any>(null);
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [key: string]: boolean }>({});

  const supabase = createClient();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";
  const TEAL = "#00D26A";

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.1)" : "#E2E8F0";
  const TEXT = dark ? "#FFFFFF" : "#0F172A";
  const MUTED = dark ? "#94A3B8" : "#64748B";
  const TAB_BG = dark ? "#0d1527" : "#e2e8f0";
  const TAG_BG = dark ? "rgba(13,21,39,0.6)" : "rgba(241,245,249,0.8)";
  const TAG_BORDER = dark ? "rgba(30,41,59,0.6)" : "#cbd5e1";
  const INPUT_BG = dark ? "#0d1527" : "#ffffff";
  const INPUT_BORDER = dark ? "rgba(0,255,163,0.15)" : "#cbd5e1";
  const COUNTER_BG = dark ? "#111c35" : "#e2e8f0";
  const COUNTER_BORDER = dark ? "rgba(0,255,163,0.1)" : "#cbd5e1";
  const VERIFY_BORDER = dark ? CARD : "#ffffff";

  useEffect(() => {
    fetchQuestions();
    checkUser();
  }, [activeTab, search]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const sort = activeTab === "popular" ? "popular" : "recent";
      const res = await fetch(`/api/community/questions?sort=${sort}&search=${search}`);
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newQuestion.title,
          content: newQuestion.content,
          tags: newQuestion.tags.split(",").map(t => t.trim()).filter(t => t),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setNewQuestion({ title: "", content: "", tags: "" });
        fetchQuestions();
      } else {
        console.error("Error response from API:", data);
        alert(ar ? `خطأ: ${data.error || "حدث خطأ غير معروف"}` : `Error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating question:", error);
      alert(ar ? "فشل الاتصال بالسيرفر" : "Server connection failed");
    }
  };

  const handleSubmitComment = async (questionId: string) => {
    const content = commentInput[questionId]?.trim();
    if (!content) return;

    if (!user) {
      router.push("/login");
      return;
    }

    setSubmittingComment(prev => ({ ...prev, [questionId]: true }));
    try {
      const res = await fetch("/api/community/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          content,
        }),
      });

      if (res.ok) {
        setCommentInput(prev => ({ ...prev, [questionId]: "" }));
        fetchQuestions();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmittingComment(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return ar ? date.toLocaleDateString("ar-EG") : date.toLocaleDateString("en-US");
  };

  return (
    <section style={{
      maxWidth: "1152px",
      margin: "0 auto",
      padding: "48px 24px",
      direction: ar ? "rtl" : "ltr",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "40px",
      }} className="md:flex-row">
        <div style={{ display: "flex", gap: "12px", width: "100%" }} className="md:w-auto">
          <div style={{
            display: "flex",
            backgroundColor: TAB_BG,
            padding: "6px",
            borderRadius: "12px",
            border: `1px solid ${BORDER}`,
          }}>
            <button
              onClick={() => setActiveTab("all")}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                transition: "all 0.2s",
                cursor: "pointer",
                border: "none",
                backgroundColor: activeTab === "all" ? TEAL : "transparent",
                color: activeTab === "all" ? "#000" : MUTED,
              }}
            >
              {t.all}
            </button>
            <button
              onClick={() => setActiveTab("popular")}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                transition: "all 0.2s",
                cursor: "pointer",
                border: "none",
                backgroundColor: activeTab === "popular" ? TEAL : "transparent",
                color: activeTab === "popular" ? "#000" : MUTED,
              }}
            >
              {t.popular}
            </button>
          </div>
          
          <button
            onClick={() => user ? setShowModal(true) : router.push("/login")}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 700,
              backgroundColor: TEAL,
              color: "#000",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t.askQuestion} +
          </button>
        </div>

        <div style={{
          position: "relative",
          width: "100%",
        }} className="md:w-80">
          <input
            type="text"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              border: `1px solid ${INPUT_BORDER}`,
              fontSize: "14px",
              borderRadius: "12px",
              padding: "12px 16px",
              outline: "none",
              backgroundColor: INPUT_BG,
              color: TEXT,
              fontFamily: "'Cairo', sans-serif",
              transition: "border-color 0.2s",
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: MUTED, padding: "40px" }}>{t.loading}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {questions.length === 0 ? (
            <div style={{ textAlign: "center", color: MUTED, padding: "40px" }}>{t.noQuestions}</div>
          ) : (
            questions.map((q, qIdx) => (
              <article
                key={q.id ?? qIdx}
                style={{
                  backgroundColor: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Question Header */}
                <div
                  onClick={() => router.push(`/community/question/${q.id}`)}
                  style={{
                    padding: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "24px",
                    cursor: "pointer",
                    transition: "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                  className="flex-col md:flex-row md:items-center"
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "scale(1.02) translateY(-2px)";
                    e.currentTarget.style.boxShadow = dark
                      ? "0 10px 20px -8px rgba(0,0,0,0.3)"
                      : "0 8px 16px -4px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: 1 }}>
                    <div style={{ position: "relative", flexShrink: 0, width: "48px", height: "48px" }}>
                      <img 
                        src={q.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${q.profiles?.full_name}`} 
                        alt={q.profiles?.full_name} 
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          border: `1px solid ${BORDER}`,
                          backgroundColor: dark ? "#0f172a" : "#e2e8f0",
                          objectFit: "cover"
                        }} 
                      />
                      {q.profiles?.is_verified && (
                        <span style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: "16px",
                          height: "16px",
                          backgroundColor: "#00D26A",
                          borderRadius: "50%",
                          border: `2px solid ${VERIFY_BORDER}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "9px",
                          color: "#ffffff",
                          lineHeight: 1,
                        }}>✓</span>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "12px" }}>
                        <span style={{ fontWeight: 700, color: MUTED }}>{q.profiles?.full_name}</span>
                        <span style={{
                          fontSize: "10px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          backgroundColor: q.profiles?.role === "brand"
                            ? "rgba(139,47,201,0.12)"
                            : "rgba(0,201,177,0.12)",
                          color: q.profiles?.role === "brand" ? "#A855F7" : TEAL,
                          border: `1px solid ${q.profiles?.role === "brand" ? "rgba(139,47,201,0.25)" : "rgba(0,201,177,0.25)"}`,
                        }}>
                          {q.profiles?.role === "brand" ? t.brand : t.talent}
                        </span>
                        {q.status === "pinned" && (
                          <span style={{
                            fontSize: "10px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontWeight: 700,
                            backgroundColor: "rgba(255,184,0,0.15)",
                            color: "#FFB800",
                            border: "1px solid rgba(255,184,0,0.3)",
                          }}>
                            {t.pinned} 📌
                          </span>
                        )}
                        <span style={{ color: MUTED, opacity: 0.6 }}>{formatDate(q.created_at)}</span>
                      </div>

                      <h3 style={{
                        fontSize: ar ? "18px" : "20px",
                        fontWeight: 800,
                        color: TEXT,
                        margin: 0,
                        fontFamily: "'Cairo', sans-serif",
                      }} className="md:text-xl">{q.title}</h3>

                      <p style={{
                        fontSize: "14px",
                        color: MUTED,
                        margin: 0,
                        lineHeight: 1.7,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontFamily: "'Cairo', sans-serif",
                      }}>
                        {q.content}
                      </p>

                      <div style={{ display: "flex", gap: "8px", paddingTop: "8px", flexWrap: "wrap" }}>
                        {q.tags?.map((tag, i) => (
                          <span key={`${tag}-${i}`} style={{
                            fontSize: "12px",
                            backgroundColor: TAG_BG,
                            color: MUTED,
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: `1px solid ${TAG_BORDER}`,
                            fontFamily: "'Cairo', sans-serif",
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    gap: "16px",
                    justifyContent: "space-between",
                    alignItems: "center",
                    textAlign: "center",
                    paddingTop: "16px",
                    borderTop: `1px solid ${BORDER}`,
                  }} className="md:flex-col md:gap-2 md:pt-0 md:border-t-0 w-full md:w-auto">
                    <div style={{
                      borderRadius: "12px",
                      padding: "12px 20px",
                      border: `1px solid ${COUNTER_BORDER}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: COUNTER_BG,
                      minWidth: "85px",
                    }}>
                      <span style={{ display: "block", fontSize: "20px", fontWeight: 900, color: TEAL }}>
                        {q.community_answers?.length || 0}
                      </span>
                      <span style={{ fontSize: "12px", color: MUTED }}>{t.comments}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: MUTED, opacity: 0.5, padding: "0 8px" }}>
                      <span>{q.views} {t.views}</span>
                    </div>
                  </div>
                </div>

                {/* Comments Preview */}
                {q.community_answers && q.community_answers.length > 0 && (
                  <div style={{
                    borderTop: `1px solid ${BORDER}`,
                    padding: "16px 24px",
                    backgroundColor: dark ? "rgba(0,255,163,0.02)" : "rgba(0,255,163,0.01)",
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
                      {q.community_answers.slice(0, 2).map((comment, cIdx) => (
                        <div key={comment.id ?? cIdx} style={{
                          display: "flex",
                          gap: "10px",
                          fontSize: "13px",
                        }}>
                          <img 
                            src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles?.full_name}`}
                            alt={comment.profiles?.full_name}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: TEXT, marginBottom: "2px" }}>
                              {comment.profiles?.full_name}
                            </div>
                            <div style={{
                              color: MUTED,
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}>
                              {comment.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {q.community_answers.length > 2 && (
                      <button
                        onClick={() => router.push(`/community/question/${q.id}`)}
                        style={{
                          color: TEAL,
                          fontSize: "12px",
                          fontWeight: 700,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 0",
                        }}
                      >
                        {t.viewAll} ({q.community_answers.length})
                      </button>
                    )}
                  </div>
                )}

                {/* Quick Comment Bar */}
                <div style={{
                  borderTop: `1px solid ${BORDER}`,
                  padding: "16px 24px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  backgroundColor: dark ? "rgba(0,255,163,0.02)" : "rgba(0,255,163,0.01)",
                }}>
                  {user ? (
                    <>
                      <input
                        type="text"
                        placeholder={t.addComment}
                        value={commentInput[q.id] || ""}
                        onChange={(e) => setCommentInput(prev => ({ ...prev, [q.id]: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleSubmitComment(q.id);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: "20px",
                          backgroundColor: INPUT_BG,
                          border: `1px solid ${INPUT_BORDER}`,
                          color: TEXT,
                          outline: "none",
                          fontSize: "13px",
                          fontFamily: "'Cairo', sans-serif",
                        }}
                      />
                      <button
                        onClick={() => handleSubmitComment(q.id)}
                        disabled={submittingComment[q.id] || !commentInput[q.id]?.trim()}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: TEAL,
                          color: "#000",
                          border: "none",
                          cursor: submittingComment[q.id] ? "not-allowed" : "pointer",
                          fontWeight: 700,
                          fontSize: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: submittingComment[q.id] || !commentInput[q.id]?.trim() ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {ar ? "←" : "→"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => router.push("/login")}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "20px",
                        backgroundColor: "transparent",
                        border: `1px dashed ${BORDER}`,
                        color: TEAL,
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 700,
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      {t.loginToComment}
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Ask Question Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: CARD,
            borderRadius: "20px",
            padding: "32px",
            width: "100%",
            maxWidth: "600px",
            border: `1px solid ${BORDER}`,
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h2 style={{ color: TEXT, marginBottom: "24px", fontSize: "24px", fontWeight: 800 }}>{t.askQuestion}</h2>
            <form onSubmit={handleSubmitQuestion} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", color: MUTED, marginBottom: "8px", fontSize: "14px" }}>{t.title}</label>
                <input
                  required
                  value={newQuestion.title}
                  onChange={e => setNewQuestion({ ...newQuestion, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: INPUT_BG,
                    border: `1px solid ${INPUT_BORDER}`,
                    color: TEXT,
                    outline: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: MUTED, marginBottom: "8px", fontSize: "14px" }}>{t.content}</label>
                <textarea
                  required
                  rows={5}
                  value={newQuestion.content}
                  onChange={e => setNewQuestion({ ...newQuestion, content: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: INPUT_BG,
                    border: `1px solid ${INPUT_BORDER}`,
                    color: TEXT,
                    outline: "none",
                    resize: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: MUTED, marginBottom: "8px", fontSize: "14px" }}>{t.tags}</label>
                <input
                  placeholder="marketing, fashion, price"
                  value={newQuestion.tags}
                  onChange={e => setNewQuestion({ ...newQuestion, tags: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: INPUT_BG,
                    border: `1px solid ${INPUT_BORDER}`,
                    color: TEXT,
                    outline: "none"
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "12px",
                    backgroundColor: TEAL,
                    color: "#000",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {t.submit}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "12px",
                    backgroundColor: "transparent",
                    color: MUTED,
                    fontWeight: 700,
                    border: `1px solid ${BORDER}`,
                    cursor: "pointer"
                  }}
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
