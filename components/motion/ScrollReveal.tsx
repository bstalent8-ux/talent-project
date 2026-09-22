"use client";

// ─── Direction-aware, re-triggering scroll reveal ───────────────────────────
// Fades a section in every time it enters the viewport, from either
// direction. What differs is how it leaves: scrolling DOWN past it (you're
// moving forward, it exits from the top) gets the same gentle mirror of the
// entrance. Scrolling UP past it (you're backtracking, it exits from the
// bottom) gets a distinctly stronger "recede and shrink" exit instead of a
// plain mirror — a real reverse motion, not just the entrance played
// backwards.
//
// `useInView` (not `whileInView`) is used deliberately: `whileInView` only
// gives you one "not in view" state, which can't differ by direction. Full
// manual control over `animate` lets the hidden target itself change based
// on which way the visitor is scrolling.
//
// prefers-reduced-motion: renders children with no animation at all.

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

// ─── Shared scroll-direction store ──────────────────────────────────────────
// Home mounts 9 ScrollReveal instances (one per landing section). The old
// version called useScrollDirection() per instance — 9 independent
// `window.addEventListener("scroll", ...)` handlers, each scheduling its own
// requestAnimationFrame on EVERY scroll tick (not just on a direction
// change), all computing the identical global answer. That's 9x the main-
// thread work per scroll frame for one shared value — the reported "heavy"
// scroll on /home. One listener now, ref-counted so it detaches once the
// last ScrollReveal on the page unmounts, broadcasting to every subscriber
// via useSyncExternalStore (no extra re-render machinery, no Context
// provider to remember to add).
let direction: "up" | "down" = "down";
let lastY = typeof window !== "undefined" ? window.scrollY : 0;
let ticking = false;
let subscriberCount = 0;
const listeners = new Set<() => void>();

function handleScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    if (Math.abs(y - lastY) > 2) {
      const next = y > lastY ? "down" : "up";
      lastY = y;
      if (next !== direction) {
        direction = next;
        listeners.forEach((l) => l());
      }
    } else {
      lastY = y;
    }
    ticking = false;
  });
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  if (subscriberCount === 0) {
    lastY = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
  }
  subscriberCount++;
  return () => {
    listeners.delete(onStoreChange);
    subscriberCount--;
    if (subscriberCount === 0) window.removeEventListener("scroll", handleScroll);
  };
}

function getSnapshot() {
  return direction;
}

function getServerSnapshot(): "up" | "down" {
  return "down";
}

function useScrollDirection() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function ScrollReveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });
  const direction = useScrollDirection();

  if (prefersReducedMotion) return <>{children}</>;

  // Scrolling back up past a section: it recedes and shrinks away instead of
  // just mirroring the gentle rise-in — a real reverse, not a rewind.
  const hiddenState = direction === "up"
    ? { opacity: 0, y: -64, scale: 0.9 }
    : { opacity: 0, y: 32, scale: 1 };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32, scale: 1 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : hiddenState}
      transition={{
        duration: !inView && direction === "up" ? 0.4 : 0.6,
        delay: inView ? delay : 0,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
