"use client";

const STEPS = [
  { key: "contacting",      ar: "تواصل",           en: "Contacting" },
  { key: "brief_sent",      ar: "إرسال الملخص",    en: "Brief Sent" },
  { key: "accepted",        ar: "قبول الملخص",     en: "Brief Accepted" },
  { key: "in_progress",     ar: "جاري التنفيذ",    en: "In Progress" },
  { key: "completed",       ar: "تسليم العمل",     en: "Work Delivered" },
  { key: "paid",            ar: "تم الدفع",        en: "Paid & Done" },
];

const ORDER = STEPS.map((s) => s.key);

export default function BookingTimeline({ status, dark, lang }: { status: string; dark: boolean; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const currentIdx = ORDER.indexOf(status);
  const GOLD  = "#FFB800";
  const GREEN = "#00D26A";
  const MUTED = dark ? "#334155" : "#cbd5e1";
  const TEXT  = dark ? "#f1f5f9" : "#0f172a";
  const DIMM  = dark ? "#64748b" : "#94a3b8";

  if (status === "cancelled") {
    return (
      <div style={{ textAlign: "center", padding: "16px 0", color: "#ef4444", fontWeight: 700, fontSize: 14, fontFamily: "'Cairo',sans-serif" }}>
        ✕ {ar ? "تم إلغاء هذا المشروع" : "This project was cancelled"}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", paddingBottom: 4, fontFamily: "'Cairo',sans-serif" }}>
      {STEPS.map((step, i) => {
        const done    = i < currentIdx;
        const current = i === currentIdx;
        const future  = i > currentIdx;
        const color   = done ? GREEN : current ? GOLD : MUTED;
        const textCol = done || current ? TEXT : DIMM;

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "flex-start", flex: 1, minWidth: 80 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              {/* Circle */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                backgroundColor: done ? GREEN : current ? GOLD : "transparent",
                border: `2px solid ${color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                color: done || current ? "#000" : DIMM,
                flexShrink: 0,
                transition: "all 0.3s",
              }}>
                {done ? "✓" : i + 1}
              </div>
              {/* Label */}
              <p style={{ margin: "6px 0 0", fontSize: 10, fontWeight: current ? 800 : 500, color: textCol, textAlign: "center", lineHeight: 1.3, whiteSpace: "nowrap" }}>
                {ar ? step.ar : step.en}
              </p>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, flex: 1, backgroundColor: done ? GREEN : MUTED, marginTop: 13, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
