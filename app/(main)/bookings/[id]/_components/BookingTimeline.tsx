"use client";

const STEPS = [
  { key: "pending",     ar: "مراجعة الطلب",    en: "Request Review" },
  { key: "accepted",    ar: "قبول الطلب",      en: "Accepted" },
  { key: "in_progress", ar: "قيد التنفيذ",     en: "In Progress" },
  { key: "completed",   ar: "تسليم العمل",     en: "Work Delivered" },
  { key: "paid",        ar: "مكتمل",           en: "Completed" },
];

const ORDER = STEPS.map((s) => s.key);

function normalizeStatus(status: string) {
  if (["contacting", "brief_sent", "changes_requested"].includes(status)) return "pending";
  if (status === "payment_pending") return "accepted";
  return status;
}

export default function BookingTimeline({ status, dark, lang }: { status: string; dark: boolean; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const normalized = normalizeStatus(status);
  const currentIdx = Math.max(0, ORDER.indexOf(normalized));
  const GOLD  = "#FFB800";
  const GREEN = "#00D26A";
  const RED   = "#EF4444";
  const MUTED = dark ? "#334155" : "#cbd5e1";
  const TEXT  = dark ? "#f1f5f9" : "#0f172a";
  const DIMM  = dark ? "#64748b" : "#94a3b8";

  if (["cancelled", "rejected"].includes(status)) {
    return (
      <div style={{ textAlign: "center", padding: "16px 0", color: RED, fontWeight: 700, fontSize: 14, fontFamily: "'Cairo',sans-serif" }}>
        {ar ? "تم إغلاق طلب الحجز" : "This booking request is closed"}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", paddingBottom: 4, fontFamily: "'Cairo',sans-serif" }}>
      {STEPS.map((step, i) => {
        const done    = i < currentIdx;
        const current = i === currentIdx;
        const color   = done ? GREEN : current ? GOLD : MUTED;
        const textCol = done || current ? TEXT : DIMM;

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "flex-start", flex: 1, minWidth: 90 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                backgroundColor: done ? GREEN : current ? GOLD : "transparent",
                border: `2px solid ${color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                color: done || current ? "#050B12" : DIMM,
                flexShrink: 0,
              }}>
                {done ? "✓" : i + 1}
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 10, fontWeight: current ? 800 : 500, color: textCol, textAlign: "center", lineHeight: 1.3, whiteSpace: "nowrap" }}>
                {ar ? step.ar : step.en}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, flex: 1, backgroundColor: done ? GREEN : MUTED, marginTop: 13 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
