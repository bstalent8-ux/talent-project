"use client";
import { useRef, useState } from "react";
import { useTheme, TX } from "../ProfileThemeContext";
import { useIsMobile } from "@/hooks/useIsMobile";

type PortfolioItem = {
  id: string; url: string | null;
  media_type: string; caption: string | null; sort_order: number;
};

export default function Portfolio({ items: initial, isOwn }: { items: PortfolioItem[]; isOwn?: boolean }) {
  const [items, setItems]   = useState<PortfolioItem[]>(initial ?? []);
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption]     = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { lang, CARD, BORDER, ELV, TEXT, MUTED, GOLD, GOLD_BG } = useTheme();
  const isMobile = useIsMobile();
  const tx = TX[lang];

  const FILTERS = [
    { key: "all",   label: lang === "ar" ? "الكل"  : "All" },
    { key: "photo", label: lang === "ar" ? "صور"   : "Photos" },
    { key: "video", label: lang === "ar" ? "فيديو" : "Videos" },
  ];

  const filtered = items.filter((item) => filter === "all" || item.media_type === filter);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const isVideo = file.type.startsWith("video/");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      fd.append("folder", process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents/portfolio");
      const endpoint = isVideo
        ? `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`
        : `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

      const res  = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.secure_url) throw new Error("upload failed");

      const saveRes = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.secure_url, media_type: isVideo ? "video" : "photo", caption }),
      });
      const saved = await saveRes.json();
      if (saved.item) {
        setItems(prev => [saved.item, ...prev]);
        setCaption("");
        setShowAdd(false);
      }
    } catch (e) {
      console.error("upload error", e);
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/portfolio", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3 style={{ color: TEXT, fontSize: "16px", fontWeight: 700, margin: 0 }}>{tx.tabPortfolio}</h3>
          {items.length > 0 && (
            <span style={{ backgroundColor: GOLD_BG, color: GOLD, border: `1px solid ${GOLD}33`, borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>
              {items.length}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {isOwn && (
            <button onClick={() => setShowAdd(s => !s)} style={{
              backgroundColor: GOLD, color: "#000", border: "none",
              borderRadius: "7px", padding: "6px 14px", fontSize: "12px",
              fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo', sans-serif",
            }}>
              {lang === "ar" ? "+ أضف وسائط" : "+ Add Media"}
            </button>
          )}
          {items.length > 0 && (
            <button style={{ background: "none", border: "none", color: GOLD, fontSize: "13px", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
              {lang === "ar" ? `عرض الكل (${items.length}) ›` : `View all (${items.length}) ›`}
            </button>
          )}
        </div>
      </div>

      {/* Upload panel */}
      {isOwn && showAdd && (
        <div style={{ backgroundColor: ELV, borderRadius: "10px", padding: "16px", marginBottom: "14px", border: `1px solid ${GOLD}44` }}>
          <input
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder={lang === "ar" ? "تعليق على الصورة / الفيديو (اختياري)" : "Caption (optional)"}
            style={{
              width: "100%", boxSizing: "border-box", padding: "8px 12px",
              backgroundColor: CARD, border: `1px solid ${BORDER}`,
              borderRadius: "7px", color: TEXT, fontSize: "13px",
              fontFamily: "'Cairo', sans-serif", marginBottom: "10px", outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
              flex: 1, backgroundColor: GOLD, color: "#000", border: "none",
              borderRadius: "7px", padding: "10px", fontSize: "13px",
              fontWeight: 700, cursor: uploading ? "wait" : "pointer",
              fontFamily: "'Cairo', sans-serif",
            }}>
              {uploading
                ? (lang === "ar" ? "جاري الرفع..." : "Uploading...")
                : (lang === "ar" ? "📁 اختر صورة أو فيديو" : "📁 Choose Photo or Video")}
            </button>
            <button onClick={() => setShowAdd(false)} style={{
              padding: "10px 14px", backgroundColor: "transparent",
              border: `1px solid ${BORDER}`, borderRadius: "7px",
              color: MUTED, cursor: "pointer", fontFamily: "'Cairo', sans-serif",
            }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {items.length > 0 && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: "4px 12px", borderRadius: "20px",
              border: `1px solid ${filter === f.key ? GOLD : BORDER}`,
              backgroundColor: filter === f.key ? GOLD_BG : "transparent",
              color: filter === f.key ? GOLD : MUTED,
              fontSize: "12px", cursor: "pointer", fontFamily: "'Cairo', sans-serif",
            }}>{f.label}</button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: MUTED, fontSize: "14px" }}>
          {isOwn
            ? (lang === "ar" ? "لا يوجد محتوى بعد — ابدأ بإضافة صور أو فيديوهات" : "No media yet — start by adding photos or videos")
            : tx.noPortfolio}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "8px" }}>
          {filtered.slice(0, 6).map((item) => (
            <div key={item.id} style={{
              aspectRatio: "4/3", backgroundColor: ELV,
              borderRadius: "8px", position: "relative",
              overflow: "hidden", cursor: "pointer", border: `1px solid ${BORDER}`,
            }}
              onMouseEnter={e => {
                const btn = e.currentTarget.querySelector(".del-btn") as HTMLElement;
                if (btn) btn.style.opacity = "1";
              }}
              onMouseLeave={e => {
                const btn = e.currentTarget.querySelector(".del-btn") as HTMLElement;
                if (btn) btn.style.opacity = "0";
              }}
            >
              {item.url ? (
                item.media_type === "video"
                  ? <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                  : <img src={item.url} alt={item.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: MUTED }}>
                  {item.media_type === "video" ? "▶" : "📷"}
                </div>
              )}
              {item.media_type === "video" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.3)", pointerEvents: "none" }}>
                  <span style={{ fontSize: "28px" }}>▶</span>
                </div>
              )}
              {item.caption && (
                <span style={{ position: "absolute", bottom: "6px", right: "6px", backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "11px", borderRadius: "4px", padding: "2px 6px" }}>
                  {item.caption}
                </span>
              )}
              {isOwn && (
                <button className="del-btn" onClick={() => handleDelete(item.id)} style={{
                  position: "absolute", top: "6px", left: "6px",
                  backgroundColor: "rgba(220,38,38,0.85)", color: "#fff",
                  border: "none", borderRadius: "50%", width: "24px", height: "24px",
                  cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center",
                  justifyContent: "center", opacity: 0, transition: "opacity 0.2s",
                }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
