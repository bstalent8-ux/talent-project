"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export default function Checkbox({ label, className, id, ...rest }: CheckboxProps) {
  return (
    <label className={styles.row} htmlFor={id}>
      <input id={id} type="checkbox" className={[styles.box, className ?? ""].filter(Boolean).join(" ")} {...rest} />
      <span className={styles.label}>{label}</span>
    </label>
  );
}
