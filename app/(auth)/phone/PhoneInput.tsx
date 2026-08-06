"use client";

// ─── PhoneInput ────────────────────────────────────────────────────────────────
// Country selector + phone number input, built to feel like Stripe/WhatsApp/
// Airbnb/LinkedIn's phone fields without pulling in a dependency for it.
//
// Fully controlled: the caller owns `countryIso` and `number`, this component
// never merges them into one string — see the two onChange callbacks below.
// That split is deliberate (the brief: "Do NOT merge the country code into the
// typed value"), and it's what lets the caller compose whatever string the
// backend actually expects at submit time without this component knowing or
// caring what that format is.

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import styles from "../auth.module.css";
import { COUNTRIES, findCountry, flagEmoji, searchCountries, type Country } from "./countries";

export interface PhoneInputProps {
  lang: "ar" | "en";
  /** Selected country's ISO code, e.g. "EG". */
  countryIso: string;
  onCountryChange: (iso: string) => void;
  /** The LOCAL number only — never includes the dial code. */
  number: string;
  onNumberChange: (value: string) => void;
  /** id of the number <input>; the label's htmlFor should point here. */
  numberInputId: string;
  numberPlaceholder?: string;
  numberAutoComplete?: string;
  invalid?: boolean;
}

const COPY = {
  ar: { searchLabel: "بحث عن دولة", searchPlaceholder: "ابحث بالاسم أو الكود...", noResults: "لا توجد نتائج", countryLabel: "اختر الدولة" },
  en: { searchLabel: "Search country", searchPlaceholder: "Search by name or code...", noResults: "No results", countryLabel: "Select country" },
};

export default function PhoneInput({
  lang,
  countryIso,
  onCountryChange,
  number,
  onNumberChange,
  numberInputId,
  numberPlaceholder,
  numberAutoComplete,
  invalid,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const t = COPY[lang];
  const selected = findCountry(countryIso);
  const triggerId = `${numberInputId}-country-trigger`;
  const listboxId = `${numberInputId}-country-listbox`;

  const filtered = useMemo(() => searchCountries(COUNTRIES, query), [query]);

  // Reset search + highlight every time the dropdown opens, and move focus
  // into the search box — matches native <select>-with-search widgets and is
  // what makes "search input focus" from the brief actually true.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlight(Math.max(0, COUNTRIES.findIndex((c) => c.iso === countryIso)));
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Click outside closes the dropdown. mousedown (not click) so the dropdown
  // is already gone by the time a click on unrelated UI behind it fires.
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Keep the highlighted row in view as arrow keys move it.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.children[highlight] as HTMLElement | undefined;
    row?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  function selectCountry(country: Country) {
    onCountryChange(country.iso);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlight]) selectCountry(filtered[highlight]);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div className={styles.phoneFieldRow} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        className={styles.phoneCountryTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={t.countryLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span aria-hidden="true">{flagEmoji(selected.iso)}</span>
        <span className={styles.phoneCountryName}>{lang === "ar" ? selected.nameAr : selected.nameEn}</span>
        <span className={styles.phoneDialCode}>+{selected.dialCode}</span>
        <ChevronDown
          aria-hidden="true"
          className={`${styles.phoneChevron} ${open ? styles.phoneChevronOpen : ""}`}
          size={14}
        />
      </button>

      <input
        id={numberInputId}
        className={`${styles.input} ${styles.phoneNumberInput} ${invalid ? styles.inputInvalid : ""}`}
        type="tel"
        inputMode="tel"
        placeholder={numberPlaceholder}
        value={number}
        autoComplete={numberAutoComplete}
        onChange={(e) => onNumberChange(e.target.value)}
      />

      {open && (
        <div className={styles.phoneDropdown}>
          <input
            ref={searchRef}
            type="text"
            role="searchbox"
            aria-label={t.searchLabel}
            className={styles.phoneSearchInput}
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
            onKeyDown={handleSearchKeyDown}
          />

          <ul id={listboxId} role="listbox" aria-label={t.countryLabel} ref={listRef} className={styles.phoneOptionList}>
            {filtered.map((c, i) => (
              <li
                key={c.iso}
                role="option"
                aria-selected={c.iso === countryIso}
                className={[
                  styles.phoneOption,
                  i === highlight ? styles.phoneOptionHighlighted : "",
                  c.iso === countryIso ? styles.phoneOptionSelected : "",
                ].join(" ").trim()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => selectCountry(c)}
              >
                <span aria-hidden="true">{flagEmoji(c.iso)}</span>
                <span className={styles.phoneOptionName}>{lang === "ar" ? c.nameAr : c.nameEn}</span>
                <span className={styles.phoneOptionCode}>+{c.dialCode}</span>
              </li>
            ))}
            {filtered.length === 0 && <li className={styles.phoneOptionEmpty}>{t.noResults}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
