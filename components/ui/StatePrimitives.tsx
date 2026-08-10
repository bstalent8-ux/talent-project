"use client";

import type { ReactNode } from "react";
import { Inbox, AlertTriangle } from "lucide-react";
import styles from "./StatePrimitives.module.css";

export interface EmptyStateProps {
  title?: ReactNode;
  message: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}

/** Product-surface equivalent of components/admin/EmptyState.tsx — same
 *  visual language, adds an optional title/icon/action for pages that want
 *  more than a bare sentence. Admin's own EmptyState is untouched (still the
 *  right choice for dense admin tables). */
export function EmptyState({ title, message, action, icon }: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.icon}>{icon ?? <Inbox size={28} strokeWidth={1.5} />}</span>
      {title && <span className={styles.title}>{title}</span>}
      <span className={styles.message}>{message}</span>
      {action}
    </div>
  );
}

export interface ErrorStateProps {
  title?: ReactNode;
  message: ReactNode;
  action?: ReactNode;
}

export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <div className={styles.wrap}>
      <span className={`${styles.icon} ${styles.errorIcon}`}>
        <AlertTriangle size={28} strokeWidth={1.5} />
      </span>
      {title && <span className={styles.title}>{title}</span>}
      <span className={styles.message}>{message}</span>
      {action}
    </div>
  );
}

export interface LoadingStateProps {
  rows?: number;
}

export function LoadingState({ rows = 4 }: LoadingStateProps) {
  return (
    <div className={styles.skeletonStack}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.skeletonRow} style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}
