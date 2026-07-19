import { useTheme, TX } from "../ProfileThemeContext";

type Talent = {
  name: string; city: string | null; bio: string | null;
  category: string; specialties: string[];
  social_links: Record<string, string>;
};

export default function AboutSidebar({ talent }: { talent: Talent }) {
  const { lang, CARD, BORDER, ELV, TEXT, MUTED } = useTheme();
  const tx = TX[lang];

  const STAT_KEYS: { label: string; key: string }[] = [
    { label: tx.height,    key: "height" },
    { label: tx.weight,    key: "weight" },
    { label: tx.shoeSize,  key: "shoe_size" },
    { label: tx.hairColor, key: "hair_color" },
    { label: tx.eyeColor,  key: "eye_color" },
    { label: tx.languages, key: "languages" },
    { label: tx.ageRange,  key: "age_range" },
  ];

  const physicalStats = STAT_KEYS
    .map((s) => ({ ...s, value: talent.social_links?.[s.key] ?? null }))
    .filter((s) => s.value);

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
      <h4 style={{ color: TEXT, fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>
        {tx.about(talent.name.split(" ")[0])}
      </h4>

      {talent.bio && (
        <p style={{ color: MUTED, fontSize: "13px", lineHeight: 1.7, marginBottom: "12px" }}>{talent.bio}</p>
      )}

      {physicalStats.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          {physicalStats.map((s, i) => (
            <div key={i}>
              <p style={{ color: MUTED, fontSize: "11px", margin: "0 0 2px" }}>{s.label}</p>
              <p style={{ color: TEXT, fontSize: "13px", fontWeight: 600, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {talent.city && (
        <div style={{ paddingTop: physicalStats.length > 0 ? "10px" : 0, borderTop: physicalStats.length > 0 ? `1px solid ${BORDER}` : "none" }}>
          <p style={{ color: MUTED, fontSize: "11px", margin: "0 0 2px" }}>{tx.location}</p>
          <p style={{ color: TEXT, fontSize: "13px", fontWeight: 600, margin: 0 }}>📍 {talent.city}</p>
        </div>
      )}
    </div>
  );
}
