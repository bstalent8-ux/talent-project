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

const EMERALD = "var(--color-success)";
const VIOLET = "var(--color-primary-text)"; // site --color-accent, was violet

interface Props {
  talentUserId: string;
  talentName: string;
  talentAvatar: string | null;
  onOpenBrief: () => void;
  /** Lay the three cards out side by side instead of stacked. */
  horizontal?: boolean;
  /** Render without card chrome, as three hairline-divided columns inside a parent card. */
  joined?: boolean;
  /** Stack the joined columns (phones / tablets). */
  stackJoined?: boolean;
}

export default function UgcSafetyTrust({ talentUserId, talentName, talentAvatar, onOpenBrief, horizontal = false, joined = false, stackJoined = false }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "rgba(79,167,163,0.15)" : "#E6DCC3";
  const TEXT = dark ? "#fff" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";

  const bullets = ar
    ? ["توثيق هوية المواهب", "مراجعة إدارية لكل طلب", "تواصل مباشر قبل الحجز"]
    : ["Talent Identity Verification", "Admin-Moderated Bookings", "Direct Chat Before You Book"];

  function askQuestion() {
    window.dispatchEvent(new CustomEvent("open-chat-widget", {
      detail: {
        otherUserId: talentUserId,
        otherUser: { id: talentUserId, full_name: talentName, avatar_url: talentAvatar, handle: null },
      },
    }));
  }

  const HAIR = dark ? "rgba(255,255,255,0.10)" : "#E6DCC3";
  const cols = joined && !stackJoined;
  // Joined: no per-block card chrome — the parent card frames all three, hairlines split them.
  const block = (i: number, extra: React.CSSProperties = {}): React.CSSProperties => joined
    ? { padding: cols ? "0 22px" : "18px 0", ...(cols ? { paddingInlineStart: i === 0 ? 0 : 22, paddingInlineEnd: i === 2 ? 0 : 22, borderInlineStart: i === 0 ? "none" : `1px solid ${HAIR}` } : { borderTop: i === 0 ? "none" : `1px solid ${HAIR}`, paddingTop: i === 0 ? 0 : 18 }), ...extra }
    : {};

  return (
    <div style={joined ? (cols ? { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", alignItems: "stretch" } : { display: "flex", flexDirection: "column" }) : horizontal ? { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20, alignItems: "stretch" } : { display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={joined ? block(0) : { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }}>
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

      <div style={joined ? block(1, { display: "flex", flexDirection: "column", gap: 12 }) : { backgroundColor: `color-mix(in srgb, ${EMERALD} 5%, transparent)`, border: `1px solid color-mix(in srgb, ${EMERALD} 27%, transparent)`, borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
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
            style={{ padding: "11px 0", borderRadius: 12, border: "none", backgroundColor: EMERALD, color: "#052e16", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
            {ar ? "احجز الآن" : "Book Talent"}
          </motion.button>
        </ProtectedAction>
      </div>

      <div style={joined ? block(2, { display: "flex", flexDirection: "column", gap: 12 }) : { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `color-mix(in srgb, ${VIOLET} 13%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={16} color={VIOLET} />
          </div>
          <div>
            <h4 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: 0 }}>{ar ? "اسأل الموهبة" : "Ask the Talent"}</h4>
            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{ar ? "لديك سؤال؟ تواصل مباشرة" : "Have a question? Reach out directly"}</p>
          </div>
        </div>
        <ProtectedAction action="start_conversation">
          <motion.button onClick={askQuestion} whileHover={{ scale: 1.02 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 12, border: "none", backgroundColor: "#2B211D", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
            <Send size={13} />{ar ? "إرسال سؤال" : "Send Question"}
          </motion.button>
        </ProtectedAction>
      </div>
    </div>
  );
}
