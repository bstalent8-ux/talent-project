// ─── Small hand-rolled SVG charts for /admin/user-activity ─────────────────
// No charting library in this project (CLAUDE.md §11 rule 7 — no new
// dependency without a recorded decision). Plain SVG, computed from the
// data passed in, no hooks — pure presentational components.

interface Series {
  key:   string;
  label: string;
  color: string;
  data:  { date: string; value: number }[];
}

export function MultiLineTrendChart({ series, height = 200 }: { series: Series[]; height?: number }) {
  const dates = series[0]?.data.map((d) => d.date) ?? [];
  if (dates.length === 0) return null;

  const width = 700;
  const padding = 8;
  const max = Math.max(1, ...series.flatMap((s) => s.data.map((d) => d.value)));
  const stepX = dates.length > 1 ? (width - padding * 2) / (dates.length - 1) : 0;

  const pathFor = (s: Series) =>
    s.data
      .map((d, i) => {
        const x = padding + i * stepX;
        const y = height - padding - (d.value / max) * (height - padding * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img">
      {series.map((s) => (
        <path key={s.key} d={pathFor(s)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function ChartLegend({ series, textColor }: { series: { key: string; label: string; color: string }[]; textColor: string }) {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {series.map((s) => (
        <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: textColor }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} />
          {s.label}
        </span>
      ))}
    </div>
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
  const peak = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((row) => (
        <div key={row.label} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 70px", gap: 10, alignItems: "center" }}>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 12.5, color: textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4, direction: "ltr", textAlign: "left" }}>
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
