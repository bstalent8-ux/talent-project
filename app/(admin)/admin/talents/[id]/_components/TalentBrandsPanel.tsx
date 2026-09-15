"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { Trash2, Plus, CheckCircle2, Upload } from "lucide-react";
import type { AdminTalentBrand } from "@/features/admin/types";

const TX = {
  ar: {
    title: "التعاون مع البراندات",
    hint: "الاسم بييجي من قايمة الموهبة نفسها. اللوجو والتوثيق (Verified) بيدهم الأدمن بس.",
    addPlaceholder: "اسم براند جديد",
    add: "إضافة",
    year: "سنة التعاون",
    verified: "موثّق",
    uploadLogo: "رفع لوجو",
    changeLogo: "تغيير اللوجو",
    uploading: "جاري الرفع...",
    remove: "حذف",
    empty: "لا توجد براندات مسجلة بعد.",
  },
  en: {
    title: "Brand Collaborations",
    hint: "Names come from the talent's own list. Logo + Verified are admin-only.",
    addPlaceholder: "New brand name",
    add: "Add",
    year: "Year collaborated",
    verified: "Verified",
    uploadLogo: "Upload logo",
    changeLogo: "Change logo",
    uploading: "Uploading...",
    remove: "Remove",
    empty: "No brands recorded yet.",
  },
};

interface Props {
  talentProfileId: string;
  initialBrands: AdminTalentBrand[];
}

export default function TalentBrandsPanel({ talentProfileId, initialBrands }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [brands, setBrands] = useState(initialBrands);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#94a3b8" : "#64748b";
  const INPUT  = dark ? "#0a121c" : "#f8fafc";

  const inp: React.CSSProperties = {
    padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
    backgroundColor: INPUT, color: TEXT, fontSize: 13, outline: "none",
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  };

  async function refresh() {
    const res = await fetch(`/api/admin/talents/${talentProfileId}/brands`);
    if (res.ok) {
      const { brands: fresh } = await res.json();
      setBrands(fresh);
    }
    router.refresh();
  }

  async function addBrand(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/talents/${talentProfileId}/brands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: newName.trim() }),
      });
      setNewName("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patchBrand(id: string, patch: Record<string, unknown>) {
    setBrands((list) => list.map((b) => (b.id === id ? { ...b, ...toLocalPatch(patch) } : b)));
    await fetch(`/api/admin/talents/brands/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  function toLocalPatch(patch: Record<string, unknown>): Partial<AdminTalentBrand> {
    const out: Partial<AdminTalentBrand> = {};
    if ("verified" in patch) out.verified = Boolean(patch.verified);
    if ("yearCollaborated" in patch) out.yearCollaborated = patch.yearCollaborated as string | null;
    if ("logoUrl" in patch) out.logoUrl = patch.logoUrl as string | null;
    return out;
  }

  async function removeBrand(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/talents/brands/${id}`, { method: "DELETE" });
      setBrands((list) => list.filter((b) => b.id !== id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function uploadLogo(id: string, file: File) {
    setUploadingId(id);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const folder = (process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? "talents") + "/brand-logos";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", uploadPreset!);
      fd.append("folder", folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) {
        await patchBrand(id, { logoUrl: data.secure_url });
      }
    } catch {
      // best-effort — logo upload failing shouldn't break the rest of the panel
    }
    setUploadingId(null);
  }

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: "0 0 6px" }}>{title}</h3>
      <p style={{ color: MUTED, fontSize: 12, margin: "0 0 18px" }}>{t.hint}</p>
      {children}
    </div>
  );

  return section(t.title, (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {brands.length === 0 && <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{t.empty}</p>}

      {brands.map((brand) => (
        <div key={brand.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0,
            backgroundColor: dark ? "rgba(255,255,255,0.94)" : "#fff", border: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
            ) : (
              <span style={{ color: MUTED, fontSize: 14, fontWeight: 800 }}>{brand.brandName[0]?.toUpperCase()}</span>
            )}
          </div>

          <span style={{ color: TEXT, fontSize: 13.5, fontWeight: 700, flex: "1 1 140px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {brand.brandName}
          </span>

          <input
            style={{ ...inp, width: 90 }}
            placeholder={t.year}
            value={brand.yearCollaborated ?? ""}
            onChange={(e) => setBrands((list) => list.map((b) => (b.id === brand.id ? { ...b, yearCollaborated: e.target.value } : b)))}
            onBlur={(e) => patchBrand(brand.id, { yearCollaborated: e.target.value || null })}
          />

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: TEXT, cursor: "pointer" }}>
            <input type="checkbox" checked={brand.verified} onChange={(e) => patchBrand(brand.id, { verified: e.target.checked })} />
            <CheckCircle2 size={13} color={brand.verified ? "#00D26A" : MUTED} />
            {t.verified}
          </label>

          <label
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8,
              border: `1px solid ${BORDER}`, fontSize: 12, color: TEXT, cursor: uploadingId === brand.id ? "wait" : "pointer",
              opacity: uploadingId === brand.id ? 0.6 : 1,
            }}
          >
            <Upload size={12} />
            {uploadingId === brand.id ? t.uploading : (brand.logoUrl ? t.changeLogo : t.uploadLogo)}
            <input
              type="file" accept="image/*" style={{ display: "none" }}
              disabled={uploadingId === brand.id}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(brand.id, f); e.target.value = ""; }}
            />
          </label>

          <button
            type="button"
            disabled={busy}
            onClick={() => removeBrand(brand.id)}
            style={{ display: "flex", background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
            title={t.remove}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <form onSubmit={addBrand} style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <input style={{ ...inp, flex: 1 }} placeholder={t.addPlaceholder} value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none",
            backgroundColor: "#00D26A", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer",
            fontFamily: "'IBM Plex Sans Arabic', sans-serif", opacity: busy || !newName.trim() ? 0.6 : 1,
          }}
        >
          <Plus size={14} />{t.add}
        </button>
      </form>
    </div>
  ));
}
