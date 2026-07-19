import { useTheme, TX } from "../ProfileThemeContext";

type Props = {
  profileViews: number; avgRating: number;
  totalBookings: number; totalReviews: number; topBooking?: any;
};

export default function PerformanceSnapshot({ profileViews, avgRating, totalBookings, totalReviews, topBooking }: Props) {
  const { lang, CARD, BORDER, ELV, TEXT, MUTED, GOLD, GOLD_BG } = useTheme();
  const tx = TX[lang];

  const stats = [
    { icon: "👁",  value: profileViews >= 1000 ? `${(profileViews / 1000).toFixed(1)}K+` : String(profileViews), label: tx.profileViews },
    { icon: "⭐",  value: avgRating ? avgRating.toFixed(1) : "—", label: tx.avgRating },
    { icon: "📦",  value: String(totalBookings), label: tx.campaigns },
    { icon: "💬",  value: String(totalReviews),  label: tx.reviews },
  ];

  const brandName = topBooking?.client_profiles?.profiles?.full_name ?? null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: GOLD, fontSize: "12px", fontWeight: 700, marginBottom: "12px" }}>{tx.realResults}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                backgroundColor: ELV, border: `1px solid ${BORDER}`,
                borderRadius: "10px", padding: "12px", textAlign: "center",
              }}>
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>{s.icon}</div>
                <div style={{ color: GOLD, fontSize: "20px", fontWeight: 900 }}>{s.value}</div>
                <div style={{ color: MUTED, fontSize: "11px", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <p style={{ color: MUTED, fontSize: "11px", marginTop: "10px" }}>{tx.basedOn(totalBookings)}</p>
        </div>

        {topBooking ? (
          <div style={{ width: "240px", flexShrink: 0, backgroundColor: ELV, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px" }}>
            <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>{tx.topCampaign}</p>
            <p style={{ color: TEXT, fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>
              {brandName ?? topBooking.job_type ?? tx.campaigns}
            </p>
            <p style={{ color: MUTED, fontSize: "12px", marginBottom: "10px" }}>
              💰 {topBooking.fee ? `${Number(topBooking.fee).toLocaleString()} EGP` : "—"}
            </p>
            <div style={{ backgroundColor: GOLD_BG, borderRadius: "6px", padding: "8px", color: GOLD, fontSize: "12px", fontWeight: 700, textAlign: "center" }}>
              {tx.completed}
            </div>
          </div>
        ) : (
          <div style={{ width: "240px", flexShrink: 0, backgroundColor: ELV, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <p style={{ color: GOLD, fontSize: "11px", fontWeight: 700 }}>{tx.topCampaign}</p>
            <p style={{ color: MUTED, fontSize: "12px", textAlign: "center" }}>{tx.noCampaigns}</p>
          </div>
        )}
      </div>
    </div>
  );
}
