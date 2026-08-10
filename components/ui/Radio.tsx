"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./Checkbox.module.css";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

/** Shares Checkbox's row/box/label styling — accent-color works for both input types. */
export default function Radio({ label, className, id, ...rest }: RadioProps) {
  return (
    <label className={styles.row} htmlFor={id}>
      <input id={id} type="radio" className={[styles.box, className ?? ""].filter(Boolean).join(" ")} {...rest} />
      <span className={styles.label}>{label}</span>
    </label>
  );
}
