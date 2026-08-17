"use client";

// Port of ugc/untitled/components/SafetyTrust.tsx's 3 sidebar blocks.
// "Ask the Talent" no longer simulates a reply — it dispatches the real
// "open-chat-widget" event (same real chat FloatingChatWidget already
// listens for; see ProfileHero.tsx's Message button for the identical
// pattern) instead of the source's fake inline send-then-close animation.
// "Book Talent" opens the real DirectBriefModal.

import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, FileCheck2, MessageSquare, Send } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import ProtectedAction from "@/components/auth/ProtectedAction";

const EMERALD = "#10B981";
const VIOLET = "#7C3AED";

interface Props {
  talentUserId: string;
  onOpenBrief: () => void;
}

export default function UgcSafetyTrust({ talentUserId, onOpenBrief }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";

  const bullets = ar
    ? ["دفع إلكتروني آمن 100%", "مراجعة يدوية لكل طلب", "حل سريع للنزاعات خلال 24 ساعة"]
    : ["100% Secure Payments", "Manual Review for Every Order", "Fast Dispute Resolution"];

  function askQuestion() {
    window.dispatchEvent(new CustomEvent("open-chat-widget", { detail: { otherUserId: talentUserId } }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }}>
        <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={16} color={EMERALD} />{ar ? "الأمان والثقة" : "Safety & Trust"}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bullets.map((b) => (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: MUTED }}>
              <CheckCircle2 size={14} color={EMERALD} />{b}
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: `${EMERALD}0d`, border: `1px solid ${EMERALD}44`, borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: EMERALD, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileCheck2 size={16} color="#fff" />
          </div>
          <div>
            <h4 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: 0 }}>{ar ? "احجز الموهبة" : "Book Talent"}</h4>
            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{ar ? "شارك تفاصيل حملتك" : "Share your campaign brief"}</p>
          </div>
        </div>
        <ProtectedAction action="create_booking">
          <motion.button onClick={onOpenBrief} whileHover={{ scale: 1.02 }}
            style={{ padding: "11px 0", borderRadius: 12, border: "none", backgroundColor: EMERALD, color: "#052e16", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
            {ar ? "احجز الآن" : "Book Talent"}
          </motion.button>
        </ProtectedAction>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${VIOLET}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={16} color={VIOLET} />
          </div>
          <div>
            <h4 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: 0 }}>{ar ? "اسأل الموهبة" : "Ask the Talent"}</h4>
            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{ar ? "لديك سؤال؟ تواصل مباشرة" : "Have a question? Reach out directly"}</p>
          </div>
        </div>
        <ProtectedAction action="start_conversation">
          <motion.button onClick={askQuestion} whileHover={{ scale: 1.02 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 12, border: "none", backgroundColor: "#0F172A", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
            <Send size={13} />{ar ? "إرسال سؤال" : "Send Question"}
          </motion.button>
        </ProtectedAction>
      </div>
    </div>
  );
}
