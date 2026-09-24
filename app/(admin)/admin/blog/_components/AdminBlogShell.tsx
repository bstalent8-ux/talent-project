"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import AdminShell from "@/components/admin/AdminShell";
import { ADMIN_LIGHT } from "@/components/admin/adminLightTheme";

const STATUS_FILTERS = ["all", "published", "draft"] as const;

const TX = {
  ar: {
    title: "المقالات",
    subtitle: "مقالات المدونة العامة — كل مقال بينشر صفحته بتاعته على /blog لصالح الـ SEO.",
    all: "الكل", published: "منشور", draft: "مسودة",
    newPost: "مقال جديد",
  },
  en: {
    title: "Blog",
    subtitle: "Public blog articles — each one publishes its own /blog page for SEO.",
    all: "All", published: "Published", draft: "Draft",
    newPost: "New Article",
  },
};

function hrefFor(status: string) {
  return status === "all" ? "/admin/blog" : `/admin/blog?status=${status}`;
}

export default function AdminBlogShell({ status, children }: { status: string; children: React.ReactNode }) {
  const { dark, lang } = useSite();
  const t = TX[lang];

  const MUTED = dark ? "#A99B8E" : ADMIN_LIGHT.muted;
  const BORDER = dark ? "#3A2E28" : ADMIN_LIGHT.border;
  const PRIMARY = dark ? "var(--color-primary)" : ADMIN_LIGHT.primary;

  return (
    <AdminShell title={t.title}>
      <p style={{ color: MUTED, fontSize: 14, marginTop: -8, marginBottom: 20 }}>{t.subtitle}</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((s) => {
            const active = status === s;
            return (
              <Link
                key={s}
                href={hrefFor(s)}
                style={{
                  padding: "7px 16px", borderRadius: 20,
                  border: `1px solid ${active ? PRIMARY : BORDER}`,
                  backgroundColor: active ? `color-mix(in srgb, ${PRIMARY} 10%, transparent)` : "transparent",
                  color: active ? PRIMARY : MUTED, fontSize: 13, fontWeight: active ? 700 : 400,
                  textDecoration: "none",
                }}
              >
                {t[s]}
              </Link>
            );
          })}
        </div>

        <Link
          href="/admin/blog/new"
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
            backgroundColor: PRIMARY, color: "#fff", fontSize: 13.5, fontWeight: 700, textDecoration: "none",
          }}
        >
          <Plus size={16} /> {t.newPost}
        </Link>
      </div>

      {children}
    </AdminShell>
  );
}
