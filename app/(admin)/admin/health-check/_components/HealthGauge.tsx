// ─── Half-circle health gauge ───────────────────────────────────────────────
// Hand-rolled SVG arc — no charting library (CLAUDE.md §11 rule 7). A single
// semicircle path, revealed proportionally to the score via
// stroke-dasharray/-dashoffset, colored green/amber/red by band.

const RADIUS = 80;
const STROKE = 18;
const ARC_LENGTH = Math.PI * RADIUS; // half the circle's circumference

function colorFor(score: number): string {
  if (score >= 80) return "#00D26A";
  if (score >= 50) return "#F4B740";
  return "#EF4444";
}

export default function HealthGauge({ score, trackColor }: { score: number; trackColor: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const offset = ARC_LENGTH * (1 - clamped / 100);
  const cx = 100;
  const cy = 100;

  return (
    <svg viewBox="0 0 200 110" width="220" height="121" role="img" aria-label={`${clamped}/100`}>
      <path
        d={`M ${cx - RADIUS} ${cy} A ${RADIUS} ${RADIUS} 0 0 1 ${cx + RADIUS} ${cy}`}
        fill="none"
        stroke={trackColor}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - RADIUS} ${cy} A ${RADIUS} ${RADIUS} 0 0 1 ${cx + RADIUS} ${cy}`}
        fill="none"
        stroke={colorFor(clamped)}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={ARC_LENGTH}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
      />
    </svg>
  );
}
