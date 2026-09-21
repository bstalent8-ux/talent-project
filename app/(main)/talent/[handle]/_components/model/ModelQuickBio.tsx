"use client";

// ─── Quick Bio ─────────────────────────────────────────────────────────────
// Sidebar card built to the approved reference: an icon, label and value per
// row, and a "View details" button that reveals the rest. Real fields only —
// languages plus the approved Model measurements (height, chest/waist/hip,
// weight, shoe size, hair and eye colour). Nothing entered → "No content".

import { useState, type ComponentType } from "react";
import { Languages, Ruler, Scale, Footprints, Palette, Eye, Shirt } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { FIELD_LABELS } from "../MeasurementsSection";

const GOLD = "#d89b37";
const VISIBLE = 6;

interface Props {
  measurements: Record<string, string> | null | undefined;
  languages?: string | null;
}

export default function ModelQuickBio({ measurements, languages }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const [open, setOpen] = useState(false);
  const m = measurements ?? {};

  const rows: { key: string; label: string; value: string; Icon: ComponentType<{ size?: number; color?: string }> }[] = [];
  const unit = (k: string) => (FIELD_LABELS[k]?.unit ? ` ${FIELD_LABELS[k].unit}` : "");
  const label = (k: string) => (ar ? FIELD_LABELS[k].ar : FIELD_LABELS[k].en);

  if (languages) rows.push({ key: "languages", label: ar ? "اللغات" : "Languages", value: languages, Icon: Languages });
  if (m.height) rows.push({ key: "height", label: label("height"), value: `${m.height}${unit("height")}`, Icon: Ruler });
  if (m.weight) rows.push({ key: "weight", label: label("weight"), value: `${m.weight}${unit("weight")}`, Icon: Scale });
  if (m.shoe_size) rows.push({ key: "shoe", label: label("shoe_size"), value: `${m.shoe_size}${unit("shoe_size")}`, Icon: Footprints });
  if (m.hair_color) rows.push({ key: "hair", label: label("hair_color"), value: m.hair_color, Icon: Palette });
  if (m.eye_color) rows.push({ key: "eye", label: label("eye_color"), value: m.eye_color, Icon: Eye });
  // Body measurements are a longer, secondary row — keep them behind "View details".
  if (m.chest && m.waist && m.hip) rows.push({ key: "measurements", label: ar ? "المقاسات" : "Measurements", value: `${m.chest}/${m.waist}/${m.hip}`, Icon: Shirt });

  const shown = open ? rows : rows.slice(0, VISIBLE);
  const canToggle = rows.length > VISIBLE;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
      <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>{ar ? "نبذة سريعة" : "Quick Bio"}</h3>

      {rows.length === 0 ? (
        <div style={{ padding: "18px 0", textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>{ar ? "لا يوجد محتوى" : "No content"}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {shown.map((r) => (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13.5 }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, border: `1px solid ${GOLD}66`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <r.Icon size={14} color={GOLD} />
              </span>
              <span style={{ color: MUTED, whiteSpace: "nowrap" }}>{r.label}:</span>
              <span style={{ color: TEXT, fontWeight: 700, minWidth: 0, overflowWrap: "anywhere" }} dir="auto">{r.value}</span>
            </div>
          ))}
        </div>
      )}

      {canToggle && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{ width: "100%", marginTop: 18, padding: "11px 0", borderRadius: 10, border: `1px solid ${GOLD}`, backgroundColor: "transparent", color: GOLD, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
        >
          {open ? (ar ? "عرض أقل" : "Show less") : (ar ? "عرض التفاصيل" : "View details")}
        </button>
      )}
    </div>
  );
}
