"use client";
import { useState, useRef, type KeyboardEvent } from "react";
import { useSite } from "@/contexts/SiteContext";

interface Props {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
  const { lang, dark } = useSite();
  const ar = lang === "ar";
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const BORDER = dark ? "#1e293b"  : "#E2E8F0";
  const BG     = dark ? "#0D1623"  : "#FFFFFF";
  const INPUT  = dark ? "#0a121c"  : "#F8FAFC";
  const TEXT   = dark ? "#f1f5f9"  : "#0f172a";
  const MUTED  = dark ? "#64748b"  : "#94a3b8";
  const GOLD   = "#FFB800";

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "42px";
    try { await onSend(trimmed); } finally { setSending(false); }
    textareaRef.current?.focus();
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "42px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  const placeholder = ar ? "اكتب رسالة... (Enter للإرسال)" : "Type a message… (Enter to send)";

  return (
    <div style={{
      borderTop: `1px solid ${BORDER}`,
      backgroundColor: BG,
      padding: "12px 16px",
      display: "flex",
      alignItems: "flex-end",
      gap: 10,
      direction: ar ? "rtl" : "ltr",
      flexShrink: 0,
    }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); handleInput(); }}
        onKeyDown={handleKey}
        placeholder={placeholder}
        disabled={disabled || sending}
        rows={1}
        style={{
          flex: 1, resize: "none", border: `1px solid ${BORDER}`,
          borderRadius: 12, padding: "10px 14px",
          backgroundColor: INPUT, color: TEXT,
          fontSize: 14, outline: "none",
          fontFamily: "'Cairo', sans-serif",
          lineHeight: 1.5, height: "42px", maxHeight: 160,
          transition: "border-color 0.2s",
          direction: ar ? "rtl" : "ltr",
        }}
        onFocus={(e) => (e.target.style.borderColor = GOLD)}
        onBlur={(e) => (e.target.style.borderColor = BORDER)}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || sending || disabled}
        style={{
          width: 42, height: 42, borderRadius: "50%", border: "none",
          backgroundColor: value.trim() && !sending ? GOLD : (dark ? "#1e293b" : "#e2e8f0"),
          color: value.trim() && !sending ? "#000" : MUTED,
          cursor: value.trim() && !sending ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background 0.2s",
          fontSize: 18,
        }}
      >
        {sending ? (
          <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid #00000033`, borderTopColor: "#000", animation: "spin 0.7s linear infinite" }} />
        ) : (
          ar ? "←" : "→"
        )}
      </button>
    </div>
  );
}
