"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import styles from "./Field.module.css";

interface FieldChromeProps {
  label?: string;
  helpText?: string;
  errorText?: string;
  id?: string;
}

function FieldChrome({
  label,
  helpText,
  errorText,
  id,
  children,
}: FieldChromeProps & { children: ReactNode }) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      {children}
      {errorText ? (
        <span className={styles.errorText}>{errorText}</span>
      ) : helpText ? (
        <span className={styles.helpText}>{helpText}</span>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldChromeProps {}

export function Input({ label, helpText, errorText, id, className, ...rest }: InputProps) {
  const classes = [styles.control, errorText ? styles.error : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <FieldChrome label={label} helpText={helpText} errorText={errorText} id={id}>
      <input id={id} className={classes} aria-invalid={Boolean(errorText) || undefined} {...rest} />
    </FieldChrome>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldChromeProps {}

export function Textarea({ label, helpText, errorText, id, className, ...rest }: TextareaProps) {
  const classes = [styles.control, errorText ? styles.error : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <FieldChrome label={label} helpText={helpText} errorText={errorText} id={id}>
      <textarea id={id} className={classes} aria-invalid={Boolean(errorText) || undefined} {...rest} />
    </FieldChrome>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldChromeProps {
  children: ReactNode;
}

export function Select({ label, helpText, errorText, id, className, children, ...rest }: SelectProps) {
  const classes = [styles.control, errorText ? styles.error : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <FieldChrome label={label} helpText={helpText} errorText={errorText} id={id}>
      <select id={id} className={classes} aria-invalid={Boolean(errorText) || undefined} {...rest}>
        {children}
      </select>
    </FieldChrome>
  );
}

export default Input;
