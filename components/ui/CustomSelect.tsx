"use client";

// ─── Generic custom dropdown ────────────────────────────────────────────────
// A native <select>'s open list is OS/browser-rendered and can't be given
// rounded corners or the site's own colors — the exact reason
// components/admin/AdminPagination.tsx built its own page-size picker instead
// of a <select>. This extracts that same button+popup mechanism into a
// reusable, generic control (`value`/`onChange`/`options`, like any other
// controlled form field) so every plain `<select>` across the app — admin and
// public site alike — can be replaced with the same look and the same
// keyboard/click-outside behavior, instead of each place reinventing it.
//
// Colors default to the PUBLIC site's CSS custom-property tokens
// (--bg-card, --border-subtle, ...). Admin pages don't use those tokens —
// they compute their own light/dark hex constants per file (see
// AdminPagination.tsx's BORDER/CARD/TEXT/MUTED/PRIMARY) — so pass `colors` to
// match whatever palette the call site already has, rather than duplicating
// admin's theme logic in here.
//
// This renders a real, keyboard-operable listbox (role="listbox"/"option",
// Up/Down/Home/End/Enter/Escape, typeahead-free but scroll-into-view on
// highlight) — not just a styled button. It is NOT a drop-in native <select>:
// there is no underlying form control, so a caller that reads raw FormData
// from a native form submit won't see this value. Every existing call site
// this was built for already uses controlled React state (value/onChange),
// so that gap doesn't apply to them.

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CustomSelectColors {
  border:  string;
  card:    string;
  text:    string;
  muted:   string;
  primary: string;
  /** Background of a non-active option on hover/highlight. */
  hover:   string;
}

const DEFAULT_COLORS: CustomSelectColors = {
  border:  "var(--border-subtle)",
  card:    "var(--bg-card)",
  text:    "var(--text-primary)",
  muted:   "var(--text-muted)",
  primary: "var(--color-primary)",
  hover:   "var(--bg-card-muted)",
};

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** Accessible name when there's no visible <label for=id> elsewhere. */
  "aria-label"?: string;
  className?: string;
  style?: React.CSSProperties;
  colors?: Partial<CustomSelectColors>;
  /** Open the popup above the trigger instead of below — for a control sitting
   * near the bottom of the viewport (e.g. a pagination bar). */
  openUp?: boolean;
  size?: "sm" | "md";
}

export default function CustomSelect({
  value, onChange, options, placeholder, disabled, id,
  "aria-label": ariaLabel, className, style, colors: colorsProp, openUp, size = "md",
}: CustomSelectProps) {
  const { lang } = useSite();
  const ar = lang === "ar";
  const colors: CustomSelectColors = { ...DEFAULT_COLORS, ...colorsProp };

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const generatedId = useId();
  const listboxId = useMemo(() => id ? `${id}-listbox` : `${generatedId}-listbox`, [id, generatedId]);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) return;
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current && !menuRef.current.contains(target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[highlight]?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  function commit(index: number) {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    btnRef.current?.focus();
  }

  function nextEnabled(from: number, dir: 1 | -1): number {
    let i = from;
    for (let step = 0; step < options.length; step++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i]?.disabled) return i;
    }
    return from;
  }

  function onBtnKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (open) onMenuKeyDown(e);
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setHighlight((h) => nextEnabled(h, 1)); break;
      case "ArrowUp":   e.preventDefault(); setHighlight((h) => nextEnabled(h, -1)); break;
      case "Home":      e.preventDefault(); setHighlight(nextEnabled(-1, 1)); break;
      case "End":       e.preventDefault(); setHighlight(nextEnabled(options.length, -1)); break;
      case "Enter":
      case " ":         e.preventDefault(); commit(highlight); break;
      case "Escape":     e.preventDefault(); setOpen(false); btnRef.current?.focus(); break;
      case "Tab":        setOpen(false); break;
    }
  }

  const sizing = size === "sm"
    ? { padH: "7px 12px", fontSize: 12.5, radius: 10 }
    : { padH: "10px 14px", fontSize: 14, radius: "var(--radius-sm, 10px)" };

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <button
        ref={btnRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onBtnKeyDown}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          padding: sizing.padH, borderRadius: sizing.radius,
          border: `1px solid ${open ? colors.primary : colors.border}`,
          backgroundColor: colors.card, color: selected ? colors.text : colors.muted,
          fontSize: sizing.fontSize, fontFamily: "inherit", textAlign: ar ? "right" : "left",
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
          boxSizing: "border-box",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : (placeholder ?? "")}
        </span>
        <ChevronDown size={15} color={colors.muted} style={{ flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          aria-activedescendant={`${listboxId}-opt-${highlight}`}
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          style={{
            position: "absolute", zIndex: 50, insetInlineStart: 0,
            ...(openUp ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
            minWidth: "100%", maxHeight: 260, overflowY: "auto",
            backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14,
            padding: 4, boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          }}
        >
          {options.map((opt, i) => {
            const active = opt.value === value;
            const isHighlighted = i === highlight;
            return (
              <button
                key={opt.value}
                ref={(el) => { optionRefs.current[i] = el; }}
                id={`${listboxId}-opt-${i}`}
                type="button"
                role="option"
                aria-selected={active}
                disabled={opt.disabled}
                onClick={() => commit(i)}
                onMouseEnter={() => setHighlight(i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "8px 12px", borderRadius: 10, border: "none",
                  backgroundColor: active ? `color-mix(in srgb, ${colors.primary} 12%, transparent)` : isHighlighted ? colors.hover : "transparent",
                  color: opt.disabled ? colors.muted : active ? colors.primary : colors.text,
                  fontSize: 13.5, fontWeight: active ? 700 : 400,
                  cursor: opt.disabled ? "not-allowed" : "pointer", textAlign: ar ? "right" : "left",
                  opacity: opt.disabled ? 0.5 : 1,
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.label}</span>
                {active && <Check size={14} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
