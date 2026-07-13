"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Calendar, ShieldCheck, MessageCircle, Send } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { createClient } from "@/lib/supabase/client";
import type { TalentData, PackageItem } from "@/features/talent-profile/types";
import DirectBriefModal from "@/components/DirectBriefModal";

interface Props {
  talent: TalentData;
  selectedPackage: PackageItem | null;
}

export default function StickyBookingBar({ talent, selectedPackage }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const ar = lang === "ar";
  const GREEN = "#00D26A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const pkgLabel = selectedPackage ? `${selectedPackage.name} — ${selectedPackage.price} EGP` : (ar ? "اختر باقة" : "Choose Package");
  const price = selectedPackage?.price ?? "—";

  const [userRole, setUserRole] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [showBrief, setShowBrief] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await createClient()
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      setUserRole(profile?.role ?? null);
    });
  }, []);

  async function handleContact() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    if (userRole !== "brand") return;

    setContactLoading(true);
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ other_user_id: talent.id }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      const { conversation } = await res.json();
      if (conversation?.id) {
        // Open the floating chat widget on this conversation
        window.dispatchEvent(new CustomEvent("open-chat-widget", { detail: { conversationId: conversation.id } }));
      }
    } finally {
      setContactLoading(false);
    }
  }

  return (
    <>
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: dark ? "#0A121C" : "#FFFFFF", borderTop: `1px solid ${BORDER}`, backdropFilter: "blur(16px)", height: 90, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", fontFamily: "'Cairo',sans-serif", direction: "rtl" }}>
      {/* Avatar + info */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#1e3a5f,#0d2137)", border: "2px solid rgba(0,210,106,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👩</div>
        <div>
          <p style={{ color: dark ? "#fff" : "#0F172A", fontSize: 14, fontWeight: 800, margin: 0 }}>{talent?.name ?? "Maya Khaled"}</p>
          <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{pkgLabel}</p>
        </div>
      </div>

      {/* Security indicator + price */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 11 }}>
          <ShieldCheck size={13} color={GREEN} />
          <span>{ar ? "دفع آمن بالضمان" : "Secure Escrow Payment"}</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{ar ? "الإجمالي" : "Total"}</p>
          <p style={{ color: GREEN, fontSize: 22, fontWeight: 900, margin: 0, direction: "ltr" }}>{price} <span style={{ fontSize: 12 }}>EGP</span></p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <motion.button whileHover={{ scale: 1.05 }} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(0,210,106,0.08)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Heart size={18} color={MUTED} />
        </motion.button>

        {/* Contact button — only for brands */}
        {userRole === "brand" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleContact}
            disabled={contactLoading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              backgroundColor: "transparent",
              color: GREEN,
              border: `1.5px solid ${GREEN}`,
              borderRadius: 12, padding: "0 20px", height: 44,
              fontSize: 14, fontWeight: 800, cursor: "pointer",
              fontFamily: "'Cairo',sans-serif",
              opacity: contactLoading ? 0.6 : 1,
            }}
          >
            <MessageCircle size={15} />
            {contactLoading ? "..." : (ar ? "تواصل" : "Contact")}
          </motion.button>
        )}

        {/* Send Brief — brands only */}
        {userRole === "brand" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowBrief(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              backgroundColor: "transparent",
              color: "#FFB800",
              border: "1.5px solid #FFB800",
              borderRadius: 12, padding: "0 20px", height: 44,
              fontSize: 14, fontWeight: 800, cursor: "pointer",
              fontFamily: "'Cairo',sans-serif",
            }}
          >
            <Send size={15} />
            {ar ? "إرسال ملخص" : "Send Brief"}
          </motion.button>
        )}

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: GREEN, color: "#000", border: "none", borderRadius: 12, padding: "0 28px", height: 44, fontSize: 15, fontWeight: 900, cursor: "pointer", fontFamily: "'Cairo',sans-serif", boxShadow: "0 0 24px rgba(0,210,106,0.35)" }}>
          <Calendar size={16} />{ar ? "احجز الآن" : "Book Now"}
        </motion.button>
      </div>
    </motion.div>

    {showBrief && (
      <DirectBriefModal
        talentUserId={talent.id}
        talentName={talent.name ?? ""}
        talentAvatar={talent.avatar_url ?? null}
        talentCategory={talent.category ?? null}
        dark={dark}
        lang={lang}
        onClose={() => setShowBrief(false)}
        onSuccess={(bookingId) => { setShowBrief(false); router.push(`/bookings/${bookingId}`); }}
      />
    )}
    </>
  );
}
