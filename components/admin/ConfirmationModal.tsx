"use client";
import { useSite } from "@/contexts/SiteContext";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export default function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmColor = "var(--color-error)",
  onConfirm,
  onCancel,
  children,
}: Props) {
  const { lang } = useSite();
  if (!open) return null;

  const t = {
    confirm: confirmLabel ?? (lang === "ar" ? "تأكيد" : "Confirm"),
    cancel:  cancelLabel  ?? (lang === "ar" ? "إلغاء" : "Cancel"),
  };

  return (
    <div
      style={{
        // Matches --z-modal in app/globals.css's z-index scale; zIndex's type
        // doesn't accept a css var() string, so the numeric value is mirrored here.
        position: "fixed", inset: 0, zIndex: 80,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)", padding: 28, maxWidth: 420, width: "100%",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
        {description && <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>{description}</p>}
        {children && <div style={{ marginBottom: 16 }}>{children}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 20px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)",
              backgroundColor: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 14,
            }}
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 20px", borderRadius: "var(--radius-sm)", border: "none",
              backgroundColor: confirmColor, color: "#fff", cursor: "pointer",
              fontSize: 14, fontWeight: 700,
            }}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
