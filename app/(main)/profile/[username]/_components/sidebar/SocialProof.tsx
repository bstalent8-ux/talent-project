import { useTheme, TX } from "../ProfileThemeContext";

type SocialLinks = {
  instagram?: string; instagram_followers?: string;
  tiktok?: string;    tiktok_followers?: string;
  youtube?: string;   youtube_followers?: string;
  linkedin?: string;  linkedin_followers?: string;
  avg_reply_time?: string; response_rate?: string; repeat_clients?: string;
};

export default function SocialProof({ socialLinks }: { socialLinks: SocialLinks }) {
  const { lang, CARD, BORDER, ELV, TEXT, MUTED, GOLD } = useTheme();
  const tx = TX[lang];

  const socials = [
    { platform: "Instagram", icon: "📸", count: socialLinks.instagram_followers ?? socialLinks.instagram ?? null },
    { platform: "TikTok",    icon: "🎵", count: socialLinks.tiktok_followers    ?? socialLinks.tiktok    ?? null },
    { platform: "YouTube",   icon: "▶️", count: socialLinks.youtube_followers   ?? socialLinks.youtube   ?? null },
    { platform: "LinkedIn",  icon: "💼", count: socialLinks.linkedin_followers  ?? socialLinks.linkedin  ?? null },
  ].filter((s) => s.count);

  const metrics = [
    { label: lang === "ar" ? "وقت الرد"     : "Avg. Reply Time",  value: socialLinks.avg_reply_time ?? null },
    { label: lang === "ar" ? "معدل الرد"    : "Response Rate",    value: socialLinks.response_rate  ?? null },
    { label: lang === "ar" ? "عملاء متكررون": "Repeat Clients",   value: socialLinks.repeat_clients ?? null },
  ].filter((m) => m.value);

  if (socials.length === 0 && metrics.length === 0) return null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
      <h4 style={{ color: TEXT, fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>{tx.socialProof}</h4>

      {socials.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: metrics.length > 0 ? "14px" : 0 }}>
          {socials.map((s, i) => (
            <div key={i} style={{ backgroundColor: ELV, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>{s.icon}</div>
              <p style={{ color: TEXT, fontSize: "14px", fontWeight: 700, margin: 0 }}>{s.count}</p>
              <p style={{ color: MUTED, fontSize: "11px", margin: 0 }}>{s.platform}</p>
            </div>
          ))}
        </div>
      )}

      {metrics.length > 0 && (
        <div style={{ borderTop: socials.length > 0 ? `1px solid ${BORDER}` : "none", paddingTop: socials.length > 0 ? "12px" : 0 }}>
          <p style={{ color: MUTED, fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>{tx.responseMetrics}</p>
          {metrics.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: MUTED, fontSize: "12px" }}>{m.label}</span>
              <span style={{ color: GOLD, fontSize: "13px", fontWeight: 700 }}>{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
