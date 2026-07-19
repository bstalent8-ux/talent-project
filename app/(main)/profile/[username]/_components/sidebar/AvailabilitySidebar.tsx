import { useTheme, TX } from "../ProfileThemeContext";

export default function AvailabilitySidebar({ availability }: { availability?: string }) {
  const { lang, GOLD, GOLD_BG, MUTED, TEXT } = useTheme();
  const tx = TX[lang];

  const services = lang === "ar"
    ? ["متاح للسفر", "ران واي", "حملات إعلانية", "فعاليات", "UGC / ريلز"]
    : ["Available for Travel", "Runway", "Campaigns", "Events", "UGC / Reels"];

  return (
    <div style={{
      backgroundColor: GOLD_BG,
      border: `1px solid ${GOLD}44`,
      borderRadius: "12px", padding: "16px", marginBottom: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <h4 style={{ color: GOLD, fontSize: "14px", fontWeight: 700, margin: 0 }}>{tx.availableNow}</h4>
      </div>
      <p style={{ color: MUTED, fontSize: "12px", marginBottom: "10px" }}>
        {tx.nextAvailable("June 28, 2025")}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {services.map((s, i) => (
          <p key={i} style={{ color: TEXT, fontSize: "12px", margin: 0, display: "flex", gap: "6px" }}>
            <span style={{ color: GOLD }}>✓</span> {s}
          </p>
        ))}
      </div>
    </div>
  );
}
