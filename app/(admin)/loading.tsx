export default function AdminLoading() {
  const skeletonBlock = {
    background:
      "linear-gradient(90deg, rgba(148,163,184,0.08), rgba(148,163,184,0.16), rgba(148,163,184,0.08))",
    backgroundSize: "220% 100%",
    borderRadius: 8,
    animation: "skeleton-shimmer 1.2s ease-in-out infinite",
  };

  return (
    <main
      aria-busy="true"
      aria-label="Loading admin page"
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-skeleton] { animation: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div data-skeleton="" style={{ ...skeletonBlock, width: 220, height: 28, marginBottom: 24 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 22 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ border: "1px solid var(--bg-border)", borderRadius: 10, padding: 16, background: "var(--bg-card)" }}>
              <div data-skeleton="" style={{ ...skeletonBlock, width: "55%", height: 12, marginBottom: 14 }} />
              <div data-skeleton="" style={{ ...skeletonBlock, width: "34%", height: 26 }} />
            </div>
          ))}
        </div>
        <div style={{ border: "1px solid var(--bg-border)", borderRadius: 10, padding: 16, background: "var(--bg-card)" }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} data-skeleton="" style={{ ...skeletonBlock, height: 18, marginBottom: i === 6 ? 0 : 14 }} />
          ))}
        </div>
      </div>
    </main>
  );
}
