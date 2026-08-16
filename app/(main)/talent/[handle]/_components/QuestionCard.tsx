"use client";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

export default function QuestionCard() {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, textAlign: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "rgba(0,210,106,0.08)", border: "1px solid rgba(0,210,106,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <MessageSquare size={22} color={MUTED} />
      </div>
      <h3 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{ar ? "اسأل الموديل" : "Ask the Talent"}</h3>
      <p style={{ color: MUTED, fontSize: 12, marginBottom: 16 }}>{ar ? "لديك سؤال؟ تواصل مباشرةً" : "Have a question? Get in touch directly"}</p>
      <motion.button whileHover={{ scale: 1.02, translateY: -2 }} style={{ backgroundColor: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 0", width: "100%", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif", transition: "all 0.2s" }}>
        {ar ? "إرسال سؤال" : "Send Question"}
      </motion.button>
    </div>
  );
}
