"use client";

import Image from "next/image";
import { type DragEvent, useMemo, useRef, useState } from "react";
import { ExternalLink, GripVertical, ImagePlus, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useSite } from "@/contexts/SiteContext";
import type { TrustedBrand } from "@/features/trusted-brands/types";
import styles from "./AdminTrustedBrands.module.css";

type FormState = {
  name: string;
  logo_url: string;
  website_url: string;
  display_order: number;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  logo_url: "",
  website_url: "",
  display_order: 0,
  is_active: true,
};

function toForm(brand: TrustedBrand): FormState {
  return {
    name: brand.name,
    logo_url: brand.logo_url ?? "",
    website_url: brand.website_url ?? "",
    display_order: brand.display_order,
    is_active: brand.is_active,
  };
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function AdminTrustedBrandsClient({ initialBrands }: { initialBrands: TrustedBrand[] }) {
  const { lang } = useSite();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [brands, setBrands] = useState(initialBrands);
  const [selectedId, setSelectedId] = useState<string | null>(initialBrands[0]?.id ?? null);
  const [form, setForm] = useState<FormState>(initialBrands[0] ? toForm(initialBrands[0]) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = useMemo(
    () => brands.find((brand) => brand.id === selectedId) ?? null,
    [brands, selectedId],
  );

  const tx = {
    title: lang === "ar" ? "البراندات الموثوقة" : "Trusted Brands",
    list: lang === "ar" ? "القائمة" : "Brand list",
    editor: lang === "ar" ? "تفاصيل البراند" : "Brand details",
    newBrand: lang === "ar" ? "براند جديد" : "New brand",
    name: lang === "ar" ? "اسم البراند" : "Brand name",
    logoUrl: lang === "ar" ? "رابط اللوجو" : "Logo URL",
    website: lang === "ar" ? "رابط الموقع" : "Website URL",
    order: lang === "ar" ? "الترتيب" : "Display order",
    active: lang === "ar" ? "فعال" : "Active",
    inactive: lang === "ar" ? "غير فعال" : "Inactive",
    upload: lang === "ar" ? "رفع لوجو" : "Upload logo",
    uploading: lang === "ar" ? "جاري الرفع..." : "Uploading...",
    save: lang === "ar" ? "حفظ" : "Save",
    delete: lang === "ar" ? "حذف" : "Delete",
    activate: lang === "ar" ? "تفعيل" : "Activate",
    deactivate: lang === "ar" ? "تعطيل" : "Deactivate",
    required: lang === "ar" ? "اسم البراند مطلوب." : "Brand name is required.",
    invalidUrl: lang === "ar" ? "الروابط يجب أن تبدأ بـ http أو https." : "URLs must start with http or https.",
    empty: lang === "ar" ? "لا توجد براندات بعد." : "No trusted brands yet.",
    reorderHint: lang === "ar" ? "اسحب الصفوف لترتيب الماركي." : "Drag rows to reorder the marquee.",
    saved: lang === "ar" ? "تم الحفظ." : "Saved.",
    deleted: lang === "ar" ? "تم الحذف." : "Deleted.",
    reordered: lang === "ar" ? "تم تحديث الترتيب." : "Order updated.",
  };

  function startNew() {
    setSelectedId(null);
    setForm({ ...EMPTY_FORM, display_order: brands.length });
    setMessage(null);
  }

  function selectBrand(brand: TrustedBrand) {
    setSelectedId(brand.id);
    setForm(toForm(brand));
    setMessage(null);
  }

  function validate() {
    if (!form.name.trim()) return tx.required;
    if (!isValidUrl(form.logo_url) || !isValidUrl(form.website_url)) return tx.invalidUrl;
    return "";
  }

  async function saveBrand() {
    const validation = validate();
    if (validation) {
      setMessage({ type: "error", text: validation });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(selectedId ? `/api/admin/trusted-brands/${selectedId}` : "/api/admin/trusted-brands", {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          logo_url: form.logo_url.trim() || null,
          website_url: form.website_url.trim() || null,
          display_order: form.display_order,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      const saved = data.brand as TrustedBrand;
      setBrands((current) => {
        const exists = current.some((brand) => brand.id === saved.id);
        return (exists
          ? current.map((brand) => brand.id === saved.id ? saved : brand)
          : [...current, saved]
        ).sort((a, b) => a.display_order - b.display_order);
      });
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage({ type: "success", text: tx.saved });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/trusted-brands/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((current) => ({ ...current, logo_url: data.url }));
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Upload failed" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function setActive(brand: TrustedBrand, isActive: boolean) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/trusted-brands/${brand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_active", is_active: isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");
      setBrands((current) => current.map((item) => item.id === brand.id ? { ...item, is_active: isActive } : item));
      if (selectedId === brand.id) setForm((current) => ({ ...current, is_active: isActive }));
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Status update failed" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand() {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/trusted-brands/${selected.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setBrands((current) => current.filter((brand) => brand.id !== selected.id));
      setSelectedId(null);
      setForm(EMPTY_FORM);
      setMessage({ type: "success", text: tx.deleted });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Delete failed" });
    } finally {
      setSaving(false);
    }
  }

  async function persistOrder(nextBrands: TrustedBrand[]) {
    setBrands(nextBrands.map((brand, index) => ({ ...brand, display_order: index })));
    try {
      const res = await fetch("/api/admin/trusted-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", ids: nextBrands.map((brand) => brand.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reorder failed");
      setBrands(data.brands);
      setMessage({ type: "success", text: tx.reordered });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Reorder failed" });
    }
  }

  function onDropBrand(event: DragEvent<HTMLButtonElement>, targetId: string) {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const from = brands.findIndex((brand) => brand.id === draggedId);
    const to = brands.findIndex((brand) => brand.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...brands];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraggedId(null);
    void persistOrder(next);
  }

  return (
    <AdminShell title={tx.title}>
      <div className={styles.layout} dir={lang === "ar" ? "rtl" : "ltr"}>
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>{tx.list}</h2>
              <p>{tx.reorderHint}</p>
            </div>
            <button className={styles.secondaryButton} type="button" onClick={startNew}>
              {tx.newBrand}
            </button>
          </div>

          <div className={styles.brandList}>
            {brands.length === 0 ? <p className={styles.empty}>{tx.empty}</p> : null}
            {brands.map((brand) => (
              <button
                key={brand.id}
                draggable
                className={`${styles.brandRow} ${selectedId === brand.id ? styles.brandRowActive : ""}`}
                type="button"
                onClick={() => selectBrand(brand)}
                onDragStart={() => setDraggedId(brand.id)}
                onDragEnd={() => setDraggedId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDropBrand(event, brand.id)}
              >
                <GripVertical size={16} className={styles.dragIcon} aria-hidden="true" />
                <span className={styles.logoBox}>
                  {brand.logo_url ? (
                    <Image src={brand.logo_url} alt="" width={44} height={44} style={{ objectFit: "contain" }} />
                  ) : (
                    brand.name.charAt(0)
                  )}
                </span>
                <span className={styles.brandMeta}>
                  <strong>{brand.name}</strong>
                  <span>
                    #{brand.display_order}
                    <span className={`${styles.pill} ${brand.is_active ? styles.pillActive : ""}`}>
                      {brand.is_active ? tx.active : tx.inactive}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>{tx.editor}</h3>
              <p>{selected ? selected.name : tx.newBrand}</p>
            </div>
            {selected ? (
              <div className={styles.headerActions}>
                <button
                  className={selected.is_active ? styles.dangerButton : styles.secondaryButton}
                  disabled={saving}
                  type="button"
                  onClick={() => setActive(selected, !selected.is_active)}
                >
                  {selected.is_active ? tx.deactivate : tx.activate}
                </button>
                <button className={styles.dangerButton} disabled={saving} type="button" onClick={deleteBrand}>
                  <Trash2 size={15} />
                  {tx.delete}
                </button>
              </div>
            ) : null}
          </div>

          <div className={styles.form}>
            <div className={styles.preview}>
              <span className={styles.previewLogo}>
                {form.logo_url ? (
                  <Image src={form.logo_url} alt="" width={120} height={70} style={{ objectFit: "contain" }} />
                ) : (
                  <ImagePlus size={30} />
                )}
              </span>
              <div>
                <h3>{form.name || tx.newBrand}</h3>
                {form.website_url ? (
                  <a href={form.website_url} target="_blank" rel="noopener noreferrer">
                    {form.website_url}
                    <ExternalLink size={13} />
                  </a>
                ) : null}
              </div>
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label htmlFor="trusted-brand-name">{tx.name}</label>
                <input
                  id="trusted-brand-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="trusted-brand-order">{tx.order}</label>
                <input
                  id="trusted-brand-order"
                  min={0}
                  type="number"
                  value={form.display_order}
                  onChange={(event) => setForm((current) => ({ ...current, display_order: Number(event.target.value) }))}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="trusted-brand-logo-url">{tx.logoUrl}</label>
              <input
                id="trusted-brand-logo-url"
                dir="ltr"
                value={form.logo_url}
                onChange={(event) => setForm((current) => ({ ...current, logo_url: event.target.value }))}
              />
            </div>

            <div className={styles.uploadRow}>
              <input
                ref={fileRef}
                accept="image/*"
                className={styles.fileInput}
                type="file"
                onChange={(event) => void uploadLogo(event.target.files?.[0] ?? null)}
              />
              <button
                className={styles.secondaryButton}
                disabled={uploading}
                type="button"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus size={16} />
                {uploading ? tx.uploading : tx.upload}
              </button>
            </div>

            <div className={styles.field}>
              <label htmlFor="trusted-brand-website">{tx.website}</label>
              <input
                id="trusted-brand-website"
                dir="ltr"
                value={form.website_url}
                onChange={(event) => setForm((current) => ({ ...current, website_url: event.target.value }))}
              />
            </div>

            <label className={styles.checkboxLabel}>
              <input
                checked={form.is_active}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              {tx.active}
            </label>

            {message ? (
              <div className={`${styles.status} ${message.type === "success" ? styles.success : styles.error}`} role="status">
                {message.text}
              </div>
            ) : null}

            <div className={styles.actions}>
              <button className={styles.primaryButton} disabled={saving || uploading} type="button" onClick={saveBrand}>
                {saving ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : tx.save}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={startNew}>
                {tx.newBrand}
              </button>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
