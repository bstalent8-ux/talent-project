"use client";

// Forces every avatar upload through a square crop the talent controls
// themselves, instead of trusting Cloudinary's auto-crop (see lib/images.ts's
// g_auto fix, which only helps existing photos guess better — it still can't
// know what the person actually wants framed). No new dependency: a plain
// <canvas>, pointer-drag to pan, a range input to zoom.

import { useRef, useState, useCallback, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { useSite } from "@/contexts/SiteContext";
import { X, ZoomIn } from "lucide-react";

const STAGE_SIZE = 280;
const OUTPUT_SIZE = 640;

interface Props {
  file: File;
  onCancel: () => void;
  onCropped: (file: File) => void;
}

export default function AvatarCropModal({ file, onCancel, onCropped }: Props) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const [imgUrl] = useState(() => URL.createObjectURL(file));
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const TX = {
    ar: { title: "اقصّ صورتك", zoom: "تكبير", cancel: "إلغاء", save: "حفظ" },
    en: { title: "Crop your photo", zoom: "Zoom", cancel: "Cancel", save: "Save" },
  }[lang];

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";

  // Base scale so the shorter image side exactly fills the square stage —
  // `zoom` (>=1) is then a multiplier on top of that fit scale.
  const fitScale = naturalSize ? STAGE_SIZE / Math.min(naturalSize.w, naturalSize.h) : 1;
  const scale = fitScale * zoom;

  function clampOffset(next: { x: number; y: number }, currentScale: number) {
    if (!naturalSize) return next;
    const dispW = naturalSize.w * currentScale;
    const dispH = naturalSize.h * currentScale;
    const maxX = Math.max(0, (dispW - STAGE_SIZE) / 2);
    const maxY = Math.max(0, (dispH - STAGE_SIZE) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, next.x)), y: Math.min(maxY, Math.max(-maxY, next.y)) };
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clampOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }, scale));
  }
  function handlePointerUp() {
    dragRef.current = null;
  }
  function handleWheel(e: ReactWheelEvent<HTMLDivElement>) {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(1, z - e.deltaY * 0.0015)));
  }

  const handleImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  async function handleSave() {
    if (!naturalSize) return;
    setSaving(true);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setSaving(false); return; }

    const img = new Image();
    img.src = imgUrl;
    await new Promise((resolve) => { img.onload = resolve; });

    // Map the visible STAGE_SIZE crop window back to source-image pixels.
    const outputScale = OUTPUT_SIZE / STAGE_SIZE;
    const dispW = naturalSize.w * scale;
    const dispH = naturalSize.h * scale;
    const srcX = (dispW / 2 - STAGE_SIZE / 2 - offset.x) / scale;
    const srcY = (dispH / 2 - STAGE_SIZE / 2 - offset.y) / scale;
    const srcSize = STAGE_SIZE / scale;

    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    void outputScale;

    canvas.toBlob((blob) => {
      setSaving(false);
      if (!blob) return;
      const cropped = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      URL.revokeObjectURL(imgUrl);
      onCropped(cropped);
    }, "image/jpeg", 0.9);
  }

  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, width: "min(360px, 100%)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: 0 }}>{TX.title}</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
            <X size={18} />
          </button>
        </div>

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
          style={{
            width: STAGE_SIZE, height: STAGE_SIZE, margin: "0 auto", position: "relative",
            overflow: "hidden", borderRadius: "50%", cursor: "grab",
            backgroundColor: dark ? "#0a121c" : "#f1f5f9", touchAction: "none",
          }}
        >
          {naturalSize && (
            <img
              src={imgUrl}
              alt=""
              onLoad={handleImgLoad}
              draggable={false}
              style={{
                position: "absolute",
                left: STAGE_SIZE / 2 - (naturalSize.w * scale) / 2 + offset.x,
                top: STAGE_SIZE / 2 - (naturalSize.h * scale) / 2 + offset.y,
                width: naturalSize.w * scale,
                height: naturalSize.h * scale,
                userSelect: "none",
              }}
            />
          )}
          {!naturalSize && (
            <img src={imgUrl} alt="" onLoad={handleImgLoad} style={{ display: "none" }} />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <ZoomIn size={15} color={MUTED} />
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={(e) => { const z = Number(e.target.value); setZoom(z); setOffset((o) => clampOffset(o, fitScale * z)); }}
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
          >
            {TX.cancel}
          </button>
          <button
            disabled={!naturalSize || saving}
            onClick={handleSave}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", backgroundColor: "var(--color-primary, #0f766e)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1, fontFamily: "'Cairo',sans-serif" }}
          >
            {saving ? "…" : TX.save}
          </button>
        </div>
      </div>
    </div>
  );
}
