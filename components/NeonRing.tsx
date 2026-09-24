"use client";

// ─── Neon ring ──────────────────────────────────────────────────────────────
// A comet of light that runs around the border of its (positioned) parent — the
// Nova-style "border rotor". Drawn as a single flat-coloured SVG dash. Because it walks
// the rounded-rect PATH (pathLength = 100) the comet moves at a constant speed
// along the edge, unlike a conic-gradient sweep from the centre, which races
// along the long sides of a wide pill and crawls at the ends.
//
// Speed: one lap per `period` seconds. While the pointer is over the enclosing
// <nav> the speed eases down to SLOW_FACTOR of normal and eases back on leave —
// driven from rAF because changing a CSS animation-duration mid-flight jumps.
// prefers-reduced-motion parks the comet instead of moving it.

import { useEffect, useRef } from "react";
import styles from "./SiteChrome.module.css";

const NEON = "#e7a58a"; // Muted Peach — the brand accent
const SLOW_FACTOR = 0.28;
const EASE_PER_SECOND = 4; // how fast the speed converges to its target

// One flat-coloured comet: [dash length, opacity, stroke width].
const SEGMENTS: ReadonlyArray<readonly [number, number, number]> = [
  [14, 0.5, 1.7],
];

interface Props {
  /** Seconds per lap at normal speed. */
  period?: number;
  /** Multiplies every opacity — the logo ring is quieter than the nav ring. */
  intensity?: number;
  /** Starting position along the path, 0–100, so two rings don't move in lockstep. */
  offset?: number;
  className?: string;
}

export default function NeonRing({ period = 5, intensity = 1, offset = 0, className }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rects = Array.from(svg.querySelectorAll<SVGRectElement>("rect"));
    const scope = svg.closest("nav") ?? svg.parentElement;

    const place = (pos: number) => {
      rects.forEach((rect, i) => {
        const len = SEGMENTS[i][0];
        // Every dash ENDS at `pos`, so all heads coincide and the rest trails behind.
        rect.style.strokeDashoffset = String(-(pos - len));
      });
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pos = ((offset % 100) + 100) % 100;
    place(pos);
    if (reduce.matches) return;

    let target = 1;
    let speed = 1;
    let last = performance.now();
    let raf = 0;

    const onEnter = () => { target = SLOW_FACTOR; };
    const onLeave = () => { target = 1; };
    scope?.addEventListener("pointerenter", onEnter);
    scope?.addEventListener("pointerleave", onLeave);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      speed += (target - speed) * Math.min(1, EASE_PER_SECOND * dt);
      pos = (pos + (100 / period) * speed * dt) % 100;
      place(pos);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      scope?.removeEventListener("pointerenter", onEnter);
      scope?.removeEventListener("pointerleave", onLeave);
    };
  }, [period, offset]);

  return (
    <svg ref={svgRef} className={`${styles.neonRing} ${className ?? ""}`} aria-hidden="true" focusable="false">
      {SEGMENTS.map(([len, opacity, width], i) => (
        <rect
          key={i}
          className={styles.neonRect}
          pathLength={100}
          strokeDasharray={`${len} ${100 - len}`}
          stroke={NEON}
          strokeOpacity={opacity * intensity}
          strokeWidth={width}
        />
      ))}
    </svg>
  );
}
