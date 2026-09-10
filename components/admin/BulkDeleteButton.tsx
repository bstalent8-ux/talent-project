"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import ConfirmationModal from "./ConfirmationModal";

// Pairs with POST /api/admin/bulk-delete. Drop it next to whatever
// selection UI an admin table already has, gated on the caller's
// `canDelete` permission. `resource` must be one of the keys allow-listed
// in that route.
const TX = {
  ar: {
    label: (n: number) => `مسح ${n}`,
    deleting: "بيتمسح…",
    title: "مسح المتحدد؟",
    desc: (n: number) => `هيتمسح ${n} صف نهائيًا — الخطوة دي مش هترجع.`,
    confirm: "مسح",
    cancel: "إلغاء",
  },
  en: {
    label: (n: number) => `Delete ${n}`,
    deleting: "Deleting…",
    title: "Delete selected?",
    desc: (n: number) => `${n} row(s) will be permanently deleted — this can't be undone.`,
    confirm: "Delete",
    cancel: "Cancel",
  },
};

interface Props {
  resource: string;
  ids: string[];
  /** Called after a successful delete — clear the selection + refresh. */
  onDone: () => void;
}

export default function BulkDeleteButton({ resource, ids, onDone }: Props) {
  const { lang } = useSite();
  const t = TX[lang];
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    await fetch("/api/admin/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, ids }),
    }).catch(() => {});
    setBusy(false);
    setOpen(false);
    onDone();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy || ids.length === 0}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "6px 14px", borderRadius: 8,
          border: "1px solid rgba(239,68,68,0.35)",
          backgroundColor: "rgba(239,68,68,0.1)",
          color: "#EF4444", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        }}
      >
        <Trash2 size={13} /> {busy ? t.deleting : t.label(ids.length)}
      </button>
      <ConfirmationModal
        open={open}
        title={t.title}
        description={t.desc(ids.length)}
        confirmLabel={busy ? undefined : t.confirm}
        cancelLabel={t.cancel}
        onConfirm={run}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
