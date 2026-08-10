"use client";

interface Props {
  rows?: number;
}

export default function LoadingSkeleton({ rows = 5 }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 52,
            borderRadius: "var(--radius-md)",
            backgroundColor: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-card-muted)",
            animation: "admin-skeleton-pulse 1.5s ease-in-out infinite",
            opacity: 1 - i * 0.08,
          }}
        />
      ))}
      <style>{`
        @keyframes admin-skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @media (prefers-reduced-motion: reduce) {
          [style*="admin-skeleton-pulse"] { animation-duration: 3s; }
        }
      `}</style>
    </div>
  );
}
