"use client";

interface Props {
  label: string;
  value: number | string;
  color?: string;
  icon?: React.ReactNode;
}

export default function DashboardCard({ label, value, color = "var(--color-primary)", icon }: Props) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        borderLeft: "1px solid var(--border-subtle)",
        borderRight: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
        borderTop: `3px solid ${color}`,
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}>{label}</span>
        {icon && <span style={{ color, opacity: 0.8 }}>{icon}</span>}
      </div>
      <span style={{ color: "var(--text-primary)", fontSize: 28, fontWeight: 800 }}>{value}</span>
    </div>
  );
}
