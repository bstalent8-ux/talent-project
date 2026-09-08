// ─── Small hand-rolled SVG charts ───────────────────────────────────────────
// No charting library in this project (CLAUDE.md §11 rule 7 — no new
// dependency without a recorded decision) and these two shapes cover what
// the Meta Ads dashboard needs: a trend line and a ranked bar list. Both are
// pure presentational components — plain SVG, computed from the data passed
// in, no hooks, safe to render from a server component's client child.

interface LinePoint { label: string; value: number }

export function TrendLineChart({
  data, color, height = 160, formatValue,
}: {
  data: LinePoint[];
  color: string;
  height?: number;
  formatValue: (v: number) => string;
}) {
  if (data.length === 0) return null;
  const width = 600; // viewBox units — SVG scales to container via CSS width:100%
  const padding = 8;
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (d.value / max) * (height - padding * 2);
    return { x, y, ...d };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${height - padding} L${points[0].x.toFixed(1)},${height - padding} Z`;
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img">
      <path d={areaPath} fill={color} opacity={0.12} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r={3.5} fill={color} />
      <title>{formatValue(last.value)}</title>
    </svg>
  );
}

interface BarDatum { label: string; value: number }

export function RankedBarList({
  data, color, mutedColor, textColor, formatValue, max = 8,
}: {
  data: BarDatum[];
  color: string;
  mutedColor: string;
  textColor: string;
  formatValue: (v: number) => string;
  max?: number;
}) {
  const rows = [...data].sort((a, b) => b.value - a.value).slice(0, max);
  const peak = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((row) => (
        <div key={row.label} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 90px", gap: 10, alignItems: "center" }}>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 12.5, color: textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>
              {row.label}
            </div>
            <div style={{ height: 7, borderRadius: 4, background: mutedColor, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(3, (row.value / peak) * 100)}%`, height: "100%", background: color, borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: textColor, textAlign: "end", fontVariantNumeric: "tabular-nums" }}>
            {formatValue(row.value)}
          </div>
        </div>
      ))}
    </div>
  );
}
