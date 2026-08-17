"use client";

// Port of model/components/ActionBar.tsx. Save → real /api/favorites
// endpoint (same one the UGC hero uses). Share → real clipboard copy.
// Contact → real chat ("open-chat-widget", same event FloatingChatWidget
// already listens for).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Heart, Share2, MessageCircle } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import ProtectedAction from "@/components/auth/ProtectedAction";

const GOLD = "#d89b37";

interface Props {
  talentId: string;
  talentName: string;
  talentAvatar: string | null;
  talentHandle: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  favoriteError?: boolean;
}

export default function ModelActionBar({ talentId, talentName, talentAvatar, talentHandle, isFavorited, onToggleFavorite, favoriteError }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const ar = lang !== "en";
  const [copied, setCopied] = useState(false);

  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const SURFACE = dark ? "var(--bg-card)" : "#FFFFFF";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";

  function handleShare() {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openMessage() {
    window.dispatchEvent(new CustomEvent("open-chat-widget", {
      detail: {
        otherUserId: talentId,
        otherUser: { id: talentId, full_name: talentName, avatar_url: talentAvatar, handle: talentHandle },
      },
    }));
  }

  return (
    <div style={{
      width: "100%", maxWidth: "var(--container-max, 1440px)", margin: "0 auto",
      padding: "12px var(--container-pad, 24px)", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 12, borderBottom: `1px solid ${BORDER}`, flexWrap: "wrap",
    }}>
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/explore"))}
        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: MUTED, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "9px 14px", cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
      >
        <ArrowRight size={15} style={{ transform: ar ? "none" : "scaleX(-1)" }} />
        {ar ? "رجوع إلى النتائج" : "Back to results"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ProtectedAction action="favorite_talent">
          <button
            onClick={onToggleFavorite}
            style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, borderRadius: 10, padding: "9px 14px", cursor: "pointer", fontFamily: "'Cairo',sans-serif",
              backgroundColor: isFavorited ? "rgba(244,63,94,0.12)" : SURFACE,
              color: isFavorited ? "#fb7185" : MUTED,
              border: `1px solid ${isFavorited ? "#f43f5e80" : BORDER}`,
            }}
          >
            <Heart size={15} fill={isFavorited ? "#fb7185" : "none"} />
            {isFavorited ? (ar ? "في المفضلة" : "Favorited") : (ar ? "إضافة للمفضلة" : "Favorite")}
          </button>
        </ProtectedAction>
        {favoriteError && (
          <span style={{ fontSize: 11, color: "#fb7185" }}>
            {ar ? "تعذر تحديث المفضلة" : "Couldn't update favorites"}
          </span>
        )}

        <button
          onClick={handleShare}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: MUTED, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "9px 14px", cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
        >
          <Share2 size={15} />{copied ? (ar ? "تم النسخ" : "Copied") : (ar ? "مشاركة" : "Share")}
        </button>

        <ProtectedAction action="start_conversation">
          <button
            onClick={openMessage}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#0b0d13", background: `linear-gradient(135deg, #e5a93c, #c88924)`, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
          >
            <MessageCircle size={15} />{ar ? `تواصل مع ${talentName}` : `Contact ${talentName}`}
          </button>
        </ProtectedAction>
      </div>
    </div>
  );
}
