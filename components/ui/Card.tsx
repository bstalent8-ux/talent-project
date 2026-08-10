"use client";

import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Cards are the lazy answer — reach for this only when a bordered
   *  container is genuinely the right affordance. Never nest one inside
   *  another; use a divider or background tint instead. */
  padded?: boolean;
  /** Adds hover lift + focus ring for a clickable card (e.g. wrapped in a Link). */
  interactive?: boolean;
  children: ReactNode;
}

export default function Card({ padded = true, interactive = false, className, children, ...rest }: CardProps) {
  const classes = [
    styles.card,
    padded ? styles.padded : "",
    interactive ? styles.interactive : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} tabIndex={interactive ? 0 : undefined} {...rest}>
      {children}
    </div>
  );
}
