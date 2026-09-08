"use client";
import { useSite } from "@/contexts/SiteContext";
import { ADMIN_LIGHT } from "./adminLightTheme";

interface Props {
  label: string;
  value: number | string;
  color?: string;
  icon?: React.ReactNode;
}

// Light mode uses the admin-only palette (adminLightTheme.ts) instead of the
// global --bg-card/--text-* tokens — those are shared with the public site,
// see AdminTopbar.tsx's identical note. Dark mode is untouched. The pastel
// icon-circle look (screenshot reference, 2026-09-08) replaces the old
// top-border-accent stripe.
export default function DashboardCard({ label, value, color = "var(--color-primary)", icon }: Props) {
  const { dark } = useSite();
  const CARD  = dark ? "var(--bg-card)" : ADMIN_LIGHT.card;
  const BORDER = dark ? "var(--border-subtle)" : ADMIN_LIGHT.border;
  const TEXT  = dark ? "var(--text-primary)" : ADMIN_LIGHT.text;
  const MUTED = dark ? "var(--text-muted)" : ADMIN_LIGHT.muted;

  return (
    <div
      style={{
        backgroundColor: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: MUTED, fontSize: 13, fontWeight: 500 }}>{label}</span>
        {icon && (
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: "50%",
            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
            color,
          }}>
            {icon}
          </span>
        )}
      </div>
      <span style={{ color: TEXT, fontSize: 28, fontWeight: 800 }}>{value}</span>
    </div>
  );
}
