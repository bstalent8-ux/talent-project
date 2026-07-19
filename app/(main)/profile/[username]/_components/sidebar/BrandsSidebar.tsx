import { useTheme, TX } from "../ProfileThemeContext";

type Brand = { full_name: string; avatar_url: string | null };

export default function BrandsSidebar({ brands }: { brands: Brand[] }) {
  const { lang, CARD, BORDER, ELV, TEXT, SUB, GOLD, GOLD_BG } = useTheme();
  const tx = TX[lang];

  if (brands.length === 0) return null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
      <h4 style={{ color: TEXT, fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>{tx.brandsWorkedWith}</h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {brands.map((b, i) => (
          <div key={i} style={{ backgroundColor: ELV, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            {b.avatar_url ? (
              <img src={b.avatar_url} alt={b.full_name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: GOLD_BG, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: GOLD }}>
                {b.full_name[0]}
              </div>
            )}
            <span style={{ color: SUB, fontSize: "11px", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{b.full_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
