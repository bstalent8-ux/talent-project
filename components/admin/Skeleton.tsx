// Shared skeleton primitive for Admin loading states — table rows, stat
// cards, etc. Plain server-renderable markup (no "use client" needed), one
// shimmer keyframe defined inline so this file has zero external CSS deps.

interface Props {
  width?:  number | string;
  height?: number | string;
  radius?: number;
  style?:  React.CSSProperties;
}

export function SkeletonBlock({ width = "100%", height = 14, radius = 6, style }: Props) {
  return (
    <span
      className="admin-skeleton-block"
      style={{ display: "inline-block", width, height, borderRadius: radius, ...style }}
    />
  );
}

// Mounted once per page that uses SkeletonBlock — safe to render more than
// once (identical <style> tags), cheap enough not to bother de-duping.
export function SkeletonStyles() {
  return (
    <style>{`
      .admin-skeleton-block {
        background: linear-gradient(90deg, rgba(148,163,184,0.14) 25%, rgba(148,163,184,0.24) 37%, rgba(148,163,184,0.14) 63%);
        background-size: 400% 100%;
        animation: admin-skeleton-shimmer 1.4s ease infinite;
      }
      @keyframes admin-skeleton-shimmer {
        0% { background-position: 100% 50%; }
        100% { background-position: 0 50%; }
      }
    `}</style>
  );
}
