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
  confirmColor = "#EF4444",
  onConfirm,
  onCancel,
  children,
}: Props) {
  const { dark, lang } = useSite();
  if (!open) return null;

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const t = {
    confirm: confirmLabel ?? (lang === "ar" ? "تأكيد" : "Confirm"),
    cancel:  cancelLabel  ?? (lang === "ar" ? "إلغاء" : "Cancel"),
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: CARD, border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: 28, maxWidth: 420, width: "100%",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: TEXT, fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
        {description && <p style={{ color: MUTED, fontSize: 14, marginBottom: 16 }}>{description}</p>}
        {children && <div style={{ marginBottom: 16 }}>{children}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 20px", borderRadius: 8, border: `1px solid ${BORDER}`,
              backgroundColor: "transparent", color: MUTED, cursor: "pointer", fontSize: 14,
            }}
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
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
