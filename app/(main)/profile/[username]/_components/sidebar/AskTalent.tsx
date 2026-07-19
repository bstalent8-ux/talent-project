import { useTheme, TX } from "../ProfileThemeContext";

export default function AskTalent({ name }: { name: string }) {
  const { lang, MUTED } = useTheme();
  const tx = TX[lang];

  return (
    <div style={{
      backgroundColor: "rgba(139,47,201,0.08)",
      border: "1px solid rgba(139,47,201,0.2)",
      borderRadius: "12px", padding: "16px",
    }}>
      <h4 style={{ color: "#A855F7", fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>
        🤖 {tx.askTalent(name)}
      </h4>
      <p style={{ color: MUTED, fontSize: "12px", marginBottom: "12px" }}>
        {tx.askPlaceholder}
      </p>
      <button style={{
        width: "100%", padding: "10px", backgroundColor: "transparent",
        border: "1px solid rgba(139,47,201,0.3)", borderRadius: "8px",
        color: "#A855F7", fontSize: "13px", fontWeight: 700,
        cursor: "pointer", fontFamily: "'Cairo', sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
      }}>
        💬 {tx.send}
      </button>
    </div>
  );
}
