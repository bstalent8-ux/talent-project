"use client";
import type { TalentStatus } from "@/features/admin/types";

const CONFIG: Record<TalentStatus, { label: string; labelAr: string; bg: string; color: string }> = {
  approved:  { label: "Approved",  labelAr: "موافق عليه", bg: "rgba(0,210,106,0.12)",  color: "#00D26A" },
  pending:   { label: "Pending",   labelAr: "قيد الانتظار", bg: "rgba(244,183,64,0.12)",  color: "#F4B740" },
  rejected:  { label: "Rejected",  labelAr: "مرفوض",    bg: "rgba(239,68,68,0.12)",   color: "#EF4444" },
  suspended: { label: "Suspended", labelAr: "موقوف",    bg: "rgba(148,163,184,0.15)", color: "#94A3B8" },
};

interface Props {
  status: TalentStatus;
  lang?: "ar" | "en";
}

export default function StatusBadge({ status, lang = "en" }: Props) {
  const c = CONFIG[status];
  return (
    <span
      style={{
        backgroundColor: c.bg,
        color: c.color,
        border: `1px solid ${c.color}33`,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {lang === "ar" ? c.labelAr : c.label}
    </span>
  );
}
