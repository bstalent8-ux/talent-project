"use client";
import type { TalentStatus } from "@/features/admin/types";

const CONFIG: Record<TalentStatus, { label: string; labelAr: string; bg: string; color: string; border: string }> = {
  approved:  { label: "Approved",  labelAr: "موافق عليه",   bg: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)", border: "color-mix(in srgb, var(--color-success) 34%, transparent)" },
  pending:   { label: "Pending",   labelAr: "قيد الانتظار", bg: "var(--color-secondary-soft)", color: "var(--color-secondary)", border: "color-mix(in srgb, var(--color-secondary) 34%, transparent)" },
  rejected:  { label: "Rejected",  labelAr: "مرفوض",       bg: "color-mix(in srgb, var(--color-error) 12%, transparent)", color: "var(--color-error)", border: "color-mix(in srgb, var(--color-error) 34%, transparent)" },
  suspended: { label: "Suspended", labelAr: "موقوف",       bg: "var(--bg-card-muted)", color: "var(--text-muted)", border: "var(--border-subtle)" },
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
        border: `1px solid ${c.border}`,
        borderRadius: "var(--radius-pill)",
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
