"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { createClient } from "@/lib/supabase/client";

const TX = {
  ar: {
    back: "العودة للمجتمع",
    answers: "التعليقات",
    addAnswer: "أضف تعليقك",
    submit: "نشر التعليق",
    placeholder: "اكتب تعليقك هنا...",
    loading: "جاري التحميل...",
    loginToAnswer: "سجل الدخول لتتمكن من التعليق",
    brand: "براند",
    talent: "موهبة",
  },
  en: {
    back: "Back to Community",
    answers: "Comments",
    addAnswer: "Add your comment",
    submit: "Post Comment",
    placeholder: "Write your comment here...",
    loading: "Loading...",
    loginToAnswer: "Login to comment",
    brand: "Brand",
    talent: "Talent",
  }
};

export default function QuestionClient() {
  const { id } = useParams();
  const router = useRouter();
  const { dark, lang } = useSite();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState("");
  const [user, setUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();
  const t = TX[lang];
  const ar = lang === "ar";
  const TEAL = "#00D26A";

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.1)" : "#E2E8F0";
  const TEXT = dark ? "#FFFFFF" : "#0F172A";
  const MUTED = dark ? "#94A3B8" : "#64748B";
  const INPUT_BG = dark ? "#0d1527" : "#ffffff";
  const INPUT_BORDER = dark ? "rgba(0,255,163,0.15)" : "#cbd5e1";

  useEffect(() => {
    fetchQuestion();
    checkUser();
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchQuestion = async () => {
    try {
      const res = await fetch(`/api/community/questions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setQuestion(data);
      } else {
        router.push("/community");
      }
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    // If no user, we could potentially allow guest comments if the backend supports it.
    // For now, let's redirect to login if not authenticated, or show a message.
    if (!user) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: id,
          content: newAnswer,
        }),
      });

      if (res.ok) {
        setNewAnswer("");
        fetchQuestion();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "100px", color: MUTED }}>{t.loading}</div>;
  if (!question) return null;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: dark ? "#050B12" : "#f1f5f9",
      fontFamily: "'Cairo', sans-serif",
      direction: ar ? "rtl" : "ltr",
      padding: "40px 20px",
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <button
          onClick={() => router.push("/community")}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: TEAL,
            cursor: "pointer",
            fontWeight: 700,
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "16px"
          }}
        >
          {ar ? "←" : "→"} {t.back}
        </button>

        {/* Question Card */}
        <div style={{
          backgroundColor: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: "20px",
          padding: "32px",
          marginBottom: "32px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <img 
              src={question.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${question.profiles?.full_name}`} 
              alt={question.profiles?.full_name} 
              style={{ width: "48px", height: "48px", borderRadius: "50%", border: `1px solid ${BORDER}` }} 
            />
            <div>
              <div style={{ fontWeight: 700, color: TEXT }}>{question.profiles?.full_name}</div>
              <div style={{ fontSize: "12px", color: MUTED }}>
                {question.profiles?.role === "brand" ? t.brand : t.talent} • {new Date(question.created_at).toLocaleDateString(ar ? "ar-EG" : "en-US")}
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: 800, color: TEXT, marginBottom: "16px" }}>{question.title}</h1>
          <p style={{ color: TEXT, lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: "24px" }}>{question.content}</p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {question.tags?.map((tag: string) => (
              <span key={tag} style={{
                fontSize: "12px",
                backgroundColor: dark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                color: MUTED,
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${BORDER}`
              }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Answers Section */}
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: TEXT, marginBottom: "24px" }}>
          {t.answers} ({question.community_answers?.length || 0})
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "40px" }}>
          {question.community_answers?.map((ans: any) => (
            <div key={ans.id} style={{
              backgroundColor: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: "16px",
              padding: "24px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <img 
                  src={ans.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ans.profiles?.full_name}`} 
                  alt={ans.profiles?.full_name} 
                  style={{ width: "32px", height: "32px", borderRadius: "50%" }} 
                />
                <div style={{ fontSize: "14px" }}>
                  <span style={{ fontWeight: 700, color: TEXT }}>{ans.profiles?.full_name}</span>
                  <span style={{ color: MUTED, margin: "0 8px" }}>•</span>
                  <span style={{ color: MUTED, fontSize: "12px" }}>{new Date(ans.created_at).toLocaleDateString(ar ? "ar-EG" : "en-US")}</span>
                </div>
              </div>
              <p style={{ color: TEXT, lineHeight: 1.6, margin: 0 }}>{ans.content}</p>
            </div>
          ))}
        </div>

        {/* Add Answer Form */}
        {user ? (
          <div style={{
            backgroundColor: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: "20px",
            padding: "24px",
          }}>
            <h3 style={{ color: TEXT, marginBottom: "16px", fontWeight: 700 }}>{t.addAnswer}</h3>
            <form onSubmit={handleSubmitAnswer}>
              <textarea
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                placeholder={t.placeholder}
                rows={4}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: INPUT_BG,
                  border: `1px solid ${INPUT_BORDER}`,
                  color: TEXT,
                  outline: "none",
                  fontFamily: "inherit",
                  marginBottom: "16px",
                  resize: "none"
                }}
              />
              <button
                type="submit"
                disabled={submitting || !newAnswer.trim()}
                style={{
                  padding: "12px 32px",
                  borderRadius: "12px",
                  backgroundColor: TEAL,
                  color: "#000",
                  fontWeight: 700,
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? t.loading : t.submit}
              </button>
            </form>
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "32px",
            backgroundColor: CARD,
            borderRadius: "20px",
            border: `1px dotted ${BORDER}`,
            color: MUTED
          }}>
            <button 
              onClick={() => router.push("/login")}
              style={{ color: TEAL, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}
            >
              {t.loginToAnswer}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
