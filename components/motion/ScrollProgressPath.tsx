"use client";

// ─── Vertical scroll-progress path ──────────────────────────────────────────
// A thin line fixed to the edge of the viewport, spanning full height, that
// fills top-to-bottom as the visitor scrolls the page and drains back as
// they scroll up — the "path" the user asked for on /home. useScroll reads
// whole-DOCUMENT scroll progress (no target = window scroll), and useSpring
// smooths it so the fill doesn't feel like it's snapping to the raw scroll
// position on a fast trackpad flick.
//
// prefers-reduced-motion: the spring's physical bounce is the only "motion"
// here (the fill itself is a direct 1:1 readout of scroll position, not a
// decorative animation) — reduced motion drops the spring smoothing and
// updates the fill instantly instead, rather than hiding the element.

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgressPath() {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const smoothed = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 1000 : 120,
    damping: prefersReducedMotion ? 100 : 20,
    restDelta: 0.001,
  });

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        insetInlineStart: 0,
        top: 0,
        bottom: 0,
        width: 3,
        zIndex: 60,
        background: "rgba(16, 24, 32, 0.08)",
        pointerEvents: "none",
      }}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          transformOrigin: "top",
          scaleY: smoothed,
          background: "linear-gradient(180deg, var(--color-secondary), var(--color-primary, var(--color-secondary)))",
        }}
      />
    </div>
  );
}
