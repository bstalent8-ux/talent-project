"use client";

import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeVariant = "success" | "warning" | "error" | "neutral" | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

/**
 * State mapping (matches DESIGN.md's Colour-Plus-Label Rule — this component
 * only supplies colour; the caller's `children` must always carry the word):
 *   success = approved / accepted / active
 *   warning = pending / featured / rated
 *   error   = rejected / blocked
 *   neutral = suspended / inactive
 *   accent  = informational / brand-adjacent
 */
export default function Badge({ variant = "neutral", className, children, ...rest }: BadgeProps) {
  const classes = [styles.badge, styles[variant], className ?? ""].filter(Boolean).join(" ");
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
