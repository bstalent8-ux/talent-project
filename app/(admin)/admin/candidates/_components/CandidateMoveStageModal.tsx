"use client";
import { useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import type { CandidateStage } from "@/features/candidates/types";

const TX = {
  ar: {
    title: (label: string) => `نقل لمرحلة "${label}"`,
    followUp: "معاد الفولو أب", followUpDefault: "افتراضي: بعد يومين",
    move: "نقل", moving: "بينقل...", cancel: "إلغاء",
    requiredMissing: "لازم تجاوب على الأسئلة المطلوبة",
  },
  en: {
    title: (label: string) => `Move to "${label}"`,
    followUp: "Follow-up date", followUpDefault: "Default: in 2 days",
    move: "Move", moving: "Moving...", cancel: "Cancel",
    requiredMissing: "Please answer the required questions",
  },
};

interface Props {
  candidateId: string;
  stage: CandidateStage;
  onClose: () => void;
  onMoved: () => void;
}

export default function CandidateMoveStageModal({ candidateId, stage, onClose, onMoved }: Props) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";
  const inputStyle: React.CSSProperties = { padding: "9px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13, width: "100%" };

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [followUpAt, setFollowUpAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const missing = stage.fields.some((f) => f.required && !answers[f.fieldKey]?.trim());
    if (missing) { setError(t.requiredMissing); return; }

    setBusy(true);
    const res = await fetch(`/api/admin/candidates/${candidateId}/stage`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stageId: stage.id, answers,
        followUpAt: followUpAt ? new Date(followUpAt).toISOString() : undefined,
      }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      onMoved();
    } else {
      const data = await res?.json().catch(() => null) as { error?: string } | null;
      setError(data?.error ?? "failed");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, width: "100%", maxWidth: 420, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: TEXT }}>{t.title(lang === "ar" ? stage.labelAr : stage.labelEn)}</h3>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stage.fields.map((f) => (
            <div key={f.id}>
              <label style={{ fontSize: 11.5, color: MUTED, marginBottom: 4, display: "block" }}>
                {lang === "ar" ? f.labelAr : f.labelEn}{f.required ? " *" : ""}
              </label>
              {f.fieldType === "textarea" ? (
                <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={answers[f.fieldKey] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [f.fieldKey]: e.target.value }))} />
              ) : f.fieldType === "select" ? (
                <select style={inputStyle} value={answers[f.fieldKey] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [f.fieldKey]: e.target.value }))}>
                  <option value="">—</option>
                  {(f.options ?? []).map((opt) => <option key={opt.value} value={opt.value}>{lang === "ar" ? opt.labelAr : opt.labelEn}</option>)}
                </select>
              ) : (
                <input type={f.fieldType === "date" ? "date" : f.fieldType === "number" ? "number" : "text"} style={inputStyle} value={answers[f.fieldKey] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [f.fieldKey]: e.target.value }))} />
              )}
            </div>
          ))}

          <div>
            <label style={{ fontSize: 11.5, color: MUTED, marginBottom: 4, display: "block" }}>
              {t.followUp} <span style={{ opacity: 0.7 }}>({t.followUpDefault})</span>
            </label>
            <input type="date" style={inputStyle} value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} />
          </div>

          {error && <p style={{ margin: 0, fontSize: 12.5, color: "#EF4444" }}>{error}</p>}

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={busy}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {busy ? t.moving : t.move}
            </button>
            <button type="button" onClick={onClose}
              style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13, cursor: "pointer" }}>
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
