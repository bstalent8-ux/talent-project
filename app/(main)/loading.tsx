export default function MainLoading() {
  const skeletonBlock = {
    background:
      "linear-gradient(90deg, rgba(148,163,184,0.08), rgba(148,163,184,0.16), rgba(148,163,184,0.08))",
    backgroundSize: "220% 100%",
    borderRadius: 10,
    animation: "skeleton-shimmer 1.2s ease-in-out infinite",
  };

  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      style={{
        minHeight: "calc(100vh - 60px)",
        padding: "32px 20px 56px",
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
        <div data-skeleton="" style={{ ...skeletonBlock, width: "42%", height: 34, marginBottom: 16 }} />
        <div data-skeleton="" style={{ ...skeletonBlock, width: "68%", height: 16, marginBottom: 28 }} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                border: "1px solid var(--bg-border)",
                borderRadius: 14,
                padding: 16,
                background: "var(--bg-card)",
              }}
            >
              <div data-skeleton="" style={{ ...skeletonBlock, height: 150, marginBottom: 14 }} />
              <div data-skeleton="" style={{ ...skeletonBlock, width: "70%", height: 16, marginBottom: 10 }} />
              <div data-skeleton="" style={{ ...skeletonBlock, width: "46%", height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
