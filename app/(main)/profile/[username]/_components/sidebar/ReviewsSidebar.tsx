import { useTheme, TX } from "../ProfileThemeContext";

type Review = {
  id: string; rating: number; comment: string | null; created_at: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
};

export default function ReviewsSidebar({ reviews, avgRating, totalReviews }: {
  reviews: Review[]; avgRating: number; totalReviews: number;
}) {
  const { lang, CARD, BORDER, ELV, TEXT, SUB, MUTED, GOLD, GOLD_BG } = useTheme();
  const tx = TX[lang];
  const stars = Math.round(avgRating);

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h4 style={{ color: TEXT, fontSize: "14px", fontWeight: 700, margin: 0 }}>{tx.ratingsTitle}</h4>
        {totalReviews > 0 && (
          <button style={{ background: "none", border: "none", color: GOLD, fontSize: "12px", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
            {tx.viewAll(totalReviews)}
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <span style={{ color: GOLD, fontSize: "36px", fontWeight: 900 }}>
          {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
        </span>
        <div>
          <div style={{ color: GOLD, fontSize: "16px" }}>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</div>
          <p style={{ color: MUTED, fontSize: "12px", margin: 0 }}>{tx.ratingCount(totalReviews)}</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p style={{ color: MUTED, fontSize: "13px", textAlign: "center", padding: "12px 0" }}>{tx.noReviews}</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} style={{ backgroundColor: ELV, borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
            {r.comment && (
              <p style={{ color: SUB, fontSize: "12px", margin: "0 0 8px", lineHeight: 1.6 }}>"{r.comment}"</p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                backgroundColor: GOLD_BG, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "12px", color: GOLD, fontWeight: 700, flexShrink: 0,
              }}>
                {r.profiles?.full_name?.[0] ?? "?"}
              </div>
              <p style={{ color: TEXT, fontSize: "12px", fontWeight: 700, margin: 0 }}>
                {r.profiles?.full_name ?? tx.noClient}
              </p>
              <span style={{ color: GOLD, fontSize: "12px", marginRight: "auto" }}>★ {r.rating}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
