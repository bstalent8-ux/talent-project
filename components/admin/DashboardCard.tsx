"use client";
import { useSite } from "@/contexts/SiteContext";

interface Props {
  label: string;
  value: number | string;
  color?: string;
  icon?: React.ReactNode;
}

export default function DashboardCard({ label, value, color = "#00D26A", icon }: Props) {
  const { dark } = useSite();
  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";

  return (
    <div
      style={{
        backgroundColor: CARD,
        borderLeft: `1px solid ${BORDER}`,
        borderRight: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: MUTED, fontSize: 13, fontWeight: 500 }}>{label}</span>
        {icon && <span style={{ color, opacity: 0.8 }}>{icon}</span>}
      </div>
      <span style={{ color: TEXT, fontSize: 28, fontWeight: 800 }}>{value}</span>
    </div>
  );
}
