"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import { PIPELINE, STATUS_COLOR, STATUS_LABEL } from "./bookingStatus";

const FILTERS = ["all", ...PIPELINE, "rejected", "cancelled"] as const;

const TX = {
  ar: { title: "الحجوزات", all: "الكل" },
  en: { title: "Bookings", all: "All" },
};

// Sidebar + topbar + filter tabs — rendered immediately, never suspended, so
// they stay visible and interactive while only the table area (passed as
// `children`, wrapped in <Suspense> by page.tsx) shows a skeleton.
export default function AdminBookingsShell({ status, children }: { status: string; children: React.ReactNode }) {
  const { dark, lang } = useSite();
  const t = TX[lang];
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const BORDER = dark ? "#3A2E28" : "#E6DCC6";

  return (
    <AdminShell title={t.title}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {FILTERS.map((s) => {
          const active = status === s;
          const color = s === "all" ? "#4FA7A3" : (STATUS_COLOR[s]?.text ?? MUTED);
          return (
            <Link
              key={s}
              href={s === "all" ? "/admin/bookings" : `/admin/bookings?status=${s}`}
              style={{
                padding: "6px 14px", borderRadius: 20,
                border: `1px solid ${active ? color : BORDER}`,
                backgroundColor: active ? `${color}22` : "transparent",
                color: active ? color : MUTED, fontSize: 12, fontWeight: active ? 700 : 400,
                textDecoration: "none",
              }}
            >
              {s === "all" ? t.all : (STATUS_LABEL[s]?.[lang] ?? s)}
            </Link>
          );
        })}
      </div>
      {children}
    </AdminShell>
  );
}
