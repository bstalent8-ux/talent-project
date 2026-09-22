"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { ChevronDown, ChevronUp, FileSpreadsheet, Link2, Plus, UserPlus } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";
import type { CandidateCategoryTerm } from "@/features/candidates/types";

type Tab = "manual" | "excel" | "sheet";

const TX = {
  ar: {
    addCandidate: "إضافة مرشح", hide: "إخفاء",
    tabManual: "يدوي", tabExcel: "ملف إكسيل", tabSheet: "رابط جوجل شيت",
    name: "الاسم", phone: "رقم التليفون", email: "الإيميل", handle: "اكونت السوشيال ميديا", note: "ملاحظة",
    jobTitlePh: "الوظيفة المتقدم عليها", salaryPh: "الراتب المتوقع", categoryPh: "الكاتيجوري (اختياري)",
    submit: "إضافة", submitting: "بيتضاف...",
    dropHint: "اسحب ملف .xlsx هنا أو دوس تختار", dropActive: "سيبه هنا", uploading: "بيترفع...",
    sheetUrlLabel: "رابط الشيت (لازم يكون Anyone with the link)", sheetUrlPlaceholder: "https://docs.google.com/spreadsheets/d/...",
    importSheet: "استيراد", importing: "بيستورد...",
    manualHint: "أي حقل ممكن يفضل فاضي — املا اللي متوفر بس",
    progressLabel: "بيتسجّل", done: "تم ✓", refreshing: "بيحدّث القائمة...",
    resultCreated: (n: number) => `${n} مرشح جديد`,
    resultMerged: (n: number) => `${n} اندمج مع مرشح موجود`,
    resultFlagged: (n: number) => `${n} محتاج مراجعة (رقم مكرر)`,
    resultFailed: (n: number) => `${n} فشل`,
    error: "حصل خطأ، جرب تاني",
    fileReadError: "الملف ده متعمل بصيغة غريبة ومش قادر أقراه. افتحه في Excel أو Google Sheets واعمل حفظ/تنزيل تاني كـ.xlsx، أو استخدم رابط جوجل شيت بدل رفع الملف.",
  },
  en: {
    addCandidate: "Add candidate", hide: "Hide",
    tabManual: "Manual", tabExcel: "Excel file", tabSheet: "Google Sheet link",
    name: "Name", phone: "Phone", email: "Email", handle: "Social handle", note: "Note",
    jobTitlePh: "Job applied for", salaryPh: "Expected salary", categoryPh: "Category (optional)",
    submit: "Add", submitting: "Adding...",
    dropHint: "Drag a .xlsx file here, or click to browse", dropActive: "Drop it here", uploading: "Uploading...",
    sheetUrlLabel: "Sheet link (must be 'Anyone with the link')", sheetUrlPlaceholder: "https://docs.google.com/spreadsheets/d/...",
    importSheet: "Import", importing: "Importing...",
    manualHint: "Any field can stay blank — fill in whatever you have",
    progressLabel: "Importing", done: "Done ✓", refreshing: "Refreshing the list...",
    resultCreated: (n: number) => `${n} new candidate(s)`,
    resultMerged: (n: number) => `${n} merged into an existing candidate`,
    resultFlagged: (n: number) => `${n} need review (phone matched)`,
    resultFailed: (n: number) => `${n} failed`,
    error: "Something went wrong, try again",
    fileReadError: "This file is in a format we can't read. Open it in Excel or Google Sheets and re-save/download it as .xlsx, or use the Google Sheet link option instead.",
  },
};

interface ImportSummary { total: number; created: number; merged: number; flaggedDuplicate: number; failed: number }

export default function CandidateImportPanel({ categories }: { categories: CandidateCategoryTerm[] }) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("manual");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reads the NDJSON progress stream from /api/admin/candidates/import,
  // updating the bar per line, and returns the final summary. Throws on a
  // stream-level error so the caller shows t.error.
  async function readImportStream(res: Response): Promise<ImportSummary> {
    if (!res.ok || !res.body) throw new Error("failed");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let result: ImportSummary | null = null;

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line) as
          | { type: "progress"; processed: number; total: number }
          | { type: "done"; summary: ImportSummary }
          | { type: "error"; error: string };
        if (msg.type === "progress") setProgress({ processed: msg.processed, total: msg.total });
        else if (msg.type === "done") result = msg.summary;
        else throw new Error(msg.error);
      }
    }
    if (!result) throw new Error("no summary");
    return result;
  }

  // The board view (client-fetched) updates instantly off this event; the
  // table view (server component) needs router.refresh(), deferred a beat so
  // the "تم ✓" summary is on screen before the tree re-renders under it.
  function announceImported() {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("candidates:imported"));
    setRefreshing(true);
    setTimeout(() => { router.refresh(); setRefreshing(false); }, 1400);
  }

  const [manual, setManual] = useState({ fullName: "", phone: "", email: "", socialHandle: "", note: "", jobTitle: "", expectedSalary: "", categoryId: "" });
  const [sheetUrl, setSheetUrl] = useState("");

  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "#1e293b" : "#E2E8F0";
  const TEXT = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#94a3b8" : "#64748b";

  const inputStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
    backgroundColor: "transparent", color: TEXT, fontSize: 13, width: "100%",
  };

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setSummary(null);
    try {
      const res = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: manual.fullName || null,
          phone: manual.phone || null,
          email: manual.email || null,
          socialHandle: manual.socialHandle || null,
          extra: manual.note ? { note: manual.note } : {},
          jobTitle: manual.jobTitle || null,
          expectedSalary: manual.expectedSalary ? Number(manual.expectedSalary) : null,
          categoryId: manual.categoryId || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { merged: boolean };
      setSummary({ total: 1, created: data.merged ? 0 : 1, merged: data.merged ? 1 : 0, flaggedDuplicate: 0, failed: 0 });
      setManual({ fullName: "", phone: "", email: "", socialHandle: "", note: "", jobTitle: "", expectedSalary: "", categoryId: "" });
      router.refresh();
    } catch {
      setError(t.error);
    }
    setBusy(false);
  }

  async function submitExcel(file: File) {
    setBusy(true); setError(null); setSummary(null); setProgress(null);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      let worksheet: (typeof workbook.worksheets)[number] | undefined;
      try {
        await workbook.xlsx.load(buffer);
        worksheet = workbook.worksheets[0];
      } catch {
        setError(t.fileReadError);
        setBusy(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!worksheet) { setError(t.fileReadError); setBusy(false); return; }

      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? "").trim() || `column_${colNumber}`;
      });

      const rows: Record<string, string>[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const record: Record<string, string> = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber];
          if (!header) return;
          const raw = cell.value;
          const value = raw && typeof raw === "object" && "text" in raw ? String((raw as { text: unknown }).text) : raw;
          record[header] = value == null ? "" : String(value).trim();
        });
        if (Object.values(record).some((v) => v !== "")) rows.push(record);
      });

      const res = await fetch("/api/admin/candidates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "excel", rows }),
      });
      const s = await readImportStream(res);
      setSummary(s);
      announceImported();
    } catch {
      setError(t.error);
    }
    setBusy(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submitSheet(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setSummary(null); setProgress(null);
    try {
      const res = await fetch("/api/admin/candidates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "sheet", sheetUrl }),
      });
      // A pre-stream failure (bad URL, private sheet) still comes back as
      // plain JSON with a 4xx — handle that before trying to read a stream.
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || "failed");
      }
      const s = await readImportStream(res);
      setSummary(s);
      setSheetUrl("");
      announceImported();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg && msg !== "failed" && msg !== "no summary" ? msg : t.error);
    }
    setBusy(false);
  }

  const tabs: { key: Tab; label: string; icon: typeof UserPlus }[] = [
    { key: "manual", label: t.tabManual, icon: UserPlus },
    { key: "excel", label: t.tabExcel, icon: FileSpreadsheet },
    { key: "sheet", label: t.tabSheet, icon: Link2 },
  ];

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", background: "none", border: "none", cursor: "pointer", color: TEXT,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>
          <Plus size={15} /> {t.addCandidate}
        </span>
        {open ? <ChevronUp size={16} color={MUTED} /> : <ChevronDown size={16} color={MUTED} />}
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setTab(key); setSummary(null); setError(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${tab === key ? "var(--color-primary)" : BORDER}`,
                  backgroundColor: tab === key ? "rgba(0,210,106,0.1)" : "transparent",
                  color: tab === key ? "var(--color-primary)" : MUTED,
                  fontSize: 12.5, fontWeight: tab === key ? 700 : 400, cursor: "pointer",
                }}
              >
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {tab === "manual" && (
            <form onSubmit={submitManual} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{t.manualHint}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                <input style={inputStyle} placeholder={t.name} value={manual.fullName}
                  onChange={(e) => setManual((m) => ({ ...m, fullName: e.target.value }))} />
                <input style={inputStyle} placeholder={t.phone} value={manual.phone}
                  onChange={(e) => setManual((m) => ({ ...m, phone: e.target.value }))} />
                <input style={inputStyle} placeholder={t.email} value={manual.email}
                  onChange={(e) => setManual((m) => ({ ...m, email: e.target.value }))} />
                <input style={inputStyle} placeholder={t.handle} value={manual.socialHandle}
                  onChange={(e) => setManual((m) => ({ ...m, socialHandle: e.target.value }))} />
                <input style={inputStyle} placeholder={t.jobTitlePh} value={manual.jobTitle}
                  onChange={(e) => setManual((m) => ({ ...m, jobTitle: e.target.value }))} />
                <input style={inputStyle} type="number" placeholder={t.salaryPh} value={manual.expectedSalary}
                  onChange={(e) => setManual((m) => ({ ...m, expectedSalary: e.target.value }))} />
                <CustomSelect
                  style={inputStyle}
                  value={manual.categoryId}
                  onChange={(v) => setManual((m) => ({ ...m, categoryId: v }))}
                  colors={{ border: BORDER, card: CARD, text: TEXT, muted: MUTED, primary: "#00D26A", hover: dark ? "#131F2E" : "#F1F5F9" }}
                  options={[{ value: "", label: t.categoryPh }, ...categories.map((c) => ({ value: c.id, label: lang === "ar" ? c.labelAr : c.labelEn }))]}
                />
              </div>
              <input style={inputStyle} placeholder={t.note} value={manual.note}
                onChange={(e) => setManual((m) => ({ ...m, note: e.target.value }))} />
              <button
                type="submit"
                disabled={busy || (!manual.fullName && !manual.phone && !manual.email && !manual.socialHandle)}
                style={{
                  alignSelf: "flex-start", padding: "8px 18px", borderRadius: 8, border: "none",
                  backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? t.submitting : t.submit}
              </button>
            </form>
          )}

          {tab === "excel" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                onClick={() => !busy && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!busy) setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (busy) return;
                  const f = Array.from(e.dataTransfer.files).find((file) => file.name.toLowerCase().endsWith(".xlsx"));
                  if (f) submitExcel(f);
                }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "28px 16px", borderRadius: 10,
                  border: `2px dashed ${isDragging ? "var(--color-primary)" : BORDER}`,
                  backgroundColor: isDragging ? "rgba(0,210,106,0.06)" : "transparent",
                  cursor: busy ? "default" : "pointer", textAlign: "center",
                }}
              >
                <FileSpreadsheet size={22} color={isDragging ? "var(--color-primary)" : MUTED} />
                <span style={{ fontSize: 13, color: isDragging ? "var(--color-primary)" : MUTED, fontWeight: isDragging ? 700 : 400 }}>
                  {busy ? t.uploading : isDragging ? t.dropActive : t.dropHint}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) submitExcel(f); }}
                style={{ display: "none" }}
              />
            </div>
          )}

          {tab === "sheet" && (
            <form onSubmit={submitSheet} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 12, color: MUTED }}>{t.sheetUrlLabel}</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  style={{ ...inputStyle, flex: 1, minWidth: 240 }}
                  placeholder={t.sheetUrlPlaceholder}
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={busy || !sheetUrl}
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "none",
                    backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? t.importing : t.importSheet}
                </button>
              </div>
            </form>
          )}

          {error && <p style={{ marginTop: 10, fontSize: 12.5, color: "#EF4444" }}>{error}</p>}

          {busy && progress && progress.total > 0 && (() => {
            const pct = Math.round((progress.processed / progress.total) * 100);
            return (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: MUTED, marginBottom: 6 }}>
                  <span>{t.progressLabel}… {progress.processed} / {progress.total}</span>
                  <span style={{ fontWeight: 700, color: TEXT, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, backgroundColor: BORDER, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: "var(--color-primary)", borderRadius: 999, transition: "width 0.25s ease" }} />
                </div>
              </div>
            );
          })()}

          {!busy && summary && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 800, color: "#00D26A" }}>{t.done}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12.5, color: MUTED }}>
                {summary.created > 0 && <span style={{ color: "#00D26A" }}>{t.resultCreated(summary.created)}</span>}
                {summary.merged > 0 && <span>{t.resultMerged(summary.merged)}</span>}
                {summary.flaggedDuplicate > 0 && <span style={{ color: "#F59E0B" }}>{t.resultFlagged(summary.flaggedDuplicate)}</span>}
                {summary.failed > 0 && <span style={{ color: "#EF4444" }}>{t.resultFailed(summary.failed)}</span>}
              </div>
              {refreshing && <p style={{ margin: "6px 0 0", fontSize: 11.5, color: MUTED }}>{t.refreshing}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
