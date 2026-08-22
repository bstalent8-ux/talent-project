"use client";
import { useSite } from "@/contexts/SiteContext";
import { SkeletonBlock, SkeletonStyles } from "./Skeleton";

interface Props {
  count?:    number;
  /** Grid column minmax — match the real card grid's own minmax to avoid shift. */
  minWidth?: number;
  /** Dashboard's DashboardCard has a label+icon row above the value; talent-demand's simpler card doesn't. */
  withIcon?: boolean;
}

// Generic stat-card row skeleton — matches the CARD/BORDER dimensions every
// Admin stat-card grid already uses (see talent-demand, dashboard).
export default function AdminStatCardsSkeleton({ count = 3, minWidth = 140, withIcon = false }: Props) {
  const { dark } = useSite();
  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";

  return (
    <>
      <SkeletonStyles />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`, gap: withIcon ? 16 : 12, marginBottom: 24 }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: withIcon ? "20px 24px" : 16 }}>
            {withIcon ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <SkeletonBlock width={90} height={13} />
                <SkeletonBlock width={20} height={20} radius={6} />
              </div>
            ) : (
              <SkeletonBlock width={50} height={12} style={{ marginBottom: 10 }} />
            )}
            <SkeletonBlock width={40} height={28} />
          </div>
        ))}
      </div>
    </>
  );
}
