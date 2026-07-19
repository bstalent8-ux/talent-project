"use client";
import { useState } from "react";
import { useTheme, TX } from "../ProfileThemeContext";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function TalentHeader({ talent }: { talent: any }) {
  const [saved, setSaved] = useState(false);
  const { lang, dark, CARD, BORDER, ELV, TEXT, SUB, MUTED, GOLD, GOLD_BG } = useTheme();
  const isMobile = useIsMobile();
  const tx = TX[lang];

  const badges = [tx.verified, tx.fastResponse, tx.professional];

  return (
    <div style={{
      backgroundColor: CARD, border: `1px solid ${BORDER}`,
      borderRadius: "12px", padding: isMobile ? "16px" : "20px", marginBottom: "16px",
      display: "flex", flexDirection: isMobile ? "column" : "row", gap: "16px",
    }}>
      {/* Photo */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: "140px", height: "160px", borderRadius: "12px",
          backgroundColor: ELV, overflow: "hidden", border: `2px solid ${BORDER}`,
        }}>
          {talent.avatar_url
            ? <img src={talent.avatar_url} alt={talent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", color: GOLD }}>
                {talent.name?.[0]}
              </div>
          }
        </div>
        <div style={{
          position: "absolute", bottom: "8px", right: "8px",
          backgroundColor: "rgba(0,0,0,0.7)", borderRadius: "6px", padding: "2px 8px",
          color: SUB, fontSize: "11px",
        }}>
          1 / {talent.portfolio?.length || 1}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <h1 style={{ color: TEXT, fontSize: "22px", fontWeight: 800, margin: 0 }}>{talent.name}</h1>
          <span style={{
            backgroundColor: GOLD_BG, color: GOLD,
            border: `1px solid ${GOLD}44`, borderRadius: "6px",
            padding: "2px 10px", fontSize: "12px", fontWeight: 700,
          }}>
            {tx.goldBadge}
          </span>
          <span style={{ color: GOLD, fontSize: "16px" }}>✓</span>
        </div>

        <p style={{ color: SUB, fontSize: "14px", marginBottom: "10px" }}>
          {talent.category} · {talent.specialties?.join(" · ")}
        </p>

        <div style={{ display: "flex", gap: "16px", marginBottom: "12px", color: MUTED, fontSize: "13px" }}>
          {talent.city && <span>📍 {talent.city}</span>}
          <span>📅 {tx.memberSince}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <span style={{ color: GOLD, fontSize: "14px" }}>★ {talent.avg_rating?.toFixed(1) ?? "4.9"}</span>
          <span style={{ color: MUTED, fontSize: "13px" }}>
            {tx.ratingCount(talent.total_reviews ?? 0)}
          </span>
          <span style={{ color: MUTED, fontSize: "13px" }}>
            · {talent.profile_views >= 1000
              ? `${(talent.profile_views / 1000).toFixed(1)}K+`
              : talent.profile_views} {tx.viewsLabel}
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {badges.map((b, i) => (
            <span key={i} style={{
              backgroundColor: ELV, border: `1px solid ${BORDER}`,
              borderRadius: "6px", padding: "4px 10px", color: SUB, fontSize: "12px",
            }}>{b}</span>
          ))}
        </div>

        {talent.social_links?.avg_reply_time && (
          <p style={{ color: MUTED, fontSize: "12px", marginTop: "10px" }}>
            {tx.replyTime(talent.social_links.avg_reply_time)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", flexWrap: "wrap", gap: "8px", flexShrink: 0, width: isMobile ? "100%" : "160px" }}>
        <button style={{
          backgroundColor: GOLD, color: "#000", border: "none",
          borderRadius: "8px", padding: "12px",
          fontSize: "14px", fontWeight: 800, cursor: "pointer",
          boxShadow: `0 4px 14px rgba(255,184,0,0.35)`,
        }}>
          {tx.bookNow}
        </button>
        <button style={{
          backgroundColor: "transparent", border: `1px solid ${BORDER}`,
          borderRadius: "8px", padding: "10px",
          color: TEXT, fontSize: "13px", fontWeight: 600, cursor: "pointer",
          fontFamily: "'Cairo', sans-serif",
        }}>
          {tx.message}
        </button>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setSaved(!saved)} style={{
            flex: 1, backgroundColor: "transparent", border: `1px solid ${BORDER}`,
            borderRadius: "8px", padding: "8px",
            color: saved ? "#FF6B2B" : MUTED, fontSize: "16px", cursor: "pointer",
          }}>♥</button>
          <button style={{
            flex: 1, backgroundColor: "transparent", border: `1px solid ${BORDER}`,
            borderRadius: "8px", padding: "8px",
            color: MUTED, fontSize: "14px", cursor: "pointer",
          }}>↗</button>
        </div>

        <div style={{
          backgroundColor: ELV, border: `1px solid ${GOLD}33`,
          borderRadius: "8px", padding: "10px", marginTop: "4px",
        }}>
          <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>{tx.safePay}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "space-between" }}>
            {["💰","→","📷","→","✓","→","💰"].map((s, i) => (
              <span key={i} style={{ fontSize: i % 2 === 1 ? "10px" : "14px", color: i % 2 === 1 ? MUTED : GOLD }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
