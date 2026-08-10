"use client";

import type { ReactNode } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  key: string;
  label: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export default function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div className={styles.list} role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={item.key === active}
          className={`${styles.tab} ${item.key === active ? styles.tabActive : ""}`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
