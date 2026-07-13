"use client";
import { useSite } from "@/contexts/SiteContext";

interface Props {
  rows?: number;
}

export default function LoadingSkeleton({ rows = 5 }: Props) {
  const { dark } = useSite();
  const BG = dark ? "#0D1623" : "#F1F5F9";
  const SHIMMER = dark ? "#1e293b" : "#E2E8F0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 52,
            borderRadius: 10,
            backgroundColor: i % 2 === 0 ? BG : SHIMMER,
            animation: "pulse 1.5s ease-in-out infinite",
            opacity: 1 - i * 0.08,
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
