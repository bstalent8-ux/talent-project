"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import DirectBriefModal from "@/components/DirectBriefModal";

interface Props {
  talentUserId: string;
  talentName: string;
  talentAvatar?: string | null;
  talentCategory?: string | null;
}

export default function BriefCard({ talentUserId, talentName, talentAvatar, talentCategory }: Props) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";

  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "rgba(0,210,106,0.1)", border: "1px solid rgba(0,210,106,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <FileText size={22} color={GREEN} />
        </div>
        <h3 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{ar ? "احجز الموهبة" : "Book Talent"}</h3>
        <p style={{ color: MUTED, fontSize: 12, marginBottom: 16 }}>{ar ? "شارك تفاصيل حملتك وسيصل طلب الحجز للموهبة فوراً" : "Share your campaign details and send a booking request instantly."}</p>
        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          onClick={() => setShowModal(true)}
          style={{ backgroundColor: GREEN, color: "#050B12", border: "none", borderRadius: 10, padding: "11px 0", width: "100%", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
        >
          {ar ? "طلب حجز" : "Book Talent"}
        </motion.button>
      </div>

      {showModal && (
        <DirectBriefModal
          talentUserId={talentUserId}
          talentName={talentName}
          talentAvatar={talentAvatar}
          talentCategory={talentCategory}
          dark={dark}
          lang={lang}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); }}
        />
      )}
    </>
  );
}
