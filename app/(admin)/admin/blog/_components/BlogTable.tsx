"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import EmptyState from "@/components/admin/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import { ADMIN_LIGHT } from "@/components/admin/adminLightTheme";
import type { BlogPostRow } from "@/features/blog/types";
import { Pencil, Trash2, Eye, EyeOff, ExternalLink, FileText } from "lucide-react";

const TX = {
  ar: {
    cover: "الصورة", title: "العنوان", category: "التصنيف", lang: "اللغة", status: "الحالة",
    views: "المشاهدات", published: "تاريخ النشر", actions: "الإجراءات",
    draft: "مسودة", publishedStatus: "منشور",
    edit: "تعديل", view: "معاينة", publish: "نشر", unpublish: "إلغاء النشر", delete: "حذف",
    confirmDelete: "هل تريد حذف هذا المقال نهائياً؟",
    confirmPublish: "هل تريد نشر هذا المقال؟ هيظهر على /blog فوراً.",
    confirmUnpublish: "هل تريد إلغاء نشر هذا المقال؟",
    noPosts: "لا توجد مقالات",
    results: "نتيجة", notPublished: "—",
  },
  en: {
    cover: "Cover", title: "Title", category: "Category", lang: "Lang", status: "Status",
    views: "Views", published: "Published", actions: "Actions",
    draft: "Draft", publishedStatus: "Published",
    edit: "Edit", view: "Preview", publish: "Publish", unpublish: "Unpublish", delete: "Delete",
    confirmDelete: "Permanently delete this article?",
    confirmPublish: "Publish this article? It will appear on /blog immediately.",
    confirmUnpublish: "Unpublish this article?",
    noPosts: "No articles found",
    results: "results", notPublished: "—",
  },
};

interface Props {
  posts:    BlogPostRow[];
  total:    number;
  page:     number;
  pageSize: number;
  status:   string;
}

type ModalState = { type: "delete" | "publish" | "unpublish"; post: BlogPostRow };

export default function BlogTable({ posts, total, page, pageSize, status }: Props) {
  const { dark, lang } = useSite();
  const router = useRouter();
  const t = TX[lang];
  const ar = lang === "ar";

  const [modal, setModal] = useState<ModalState | null>(null);
  const [loading, setLoading] = useState(false);

  const CARD   = dark ? "#0D1623" : ADMIN_LIGHT.card;
  const BORDER = dark ? "#1e293b" : ADMIN_LIGHT.border;
  const TEXT   = dark ? "#f1f5f9" : ADMIN_LIGHT.text;
  const MUTED  = dark ? "#94a3b8" : ADMIN_LIGHT.muted;
  const TH     = dark ? "#0a121c" : ADMIN_LIGHT.tableHead;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (status !== "all") params.set("status", status);
    const qs = params.toString();
    return qs ? `/admin/blog?${qs}` : "/admin/blog";
  }

  async function runModalAction(m: ModalState) {
    setLoading(true);
    try {
      if (m.type === "delete") {
        await fetch(`/api/admin/blog/${m.post.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/blog/${m.post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: m.post.title, slug: m.post.slug, lang: m.post.lang, excerpt: m.post.excerpt,
            content: m.post.content, category: m.post.category, coverImageUrl: m.post.coverImageUrl,
            tags: m.post.tags, seoTitle: m.post.seoTitle, seoDescription: m.post.seoDescription,
            status: m.type === "publish" ? "published" : "draft",
          }),
        });
      }
      router.refresh();
    } finally {
      setLoading(false);
      setModal(null);
    }
  }

  const cellStyle: React.CSSProperties = { padding: "10px 14px", color: TEXT, fontSize: 13, borderBottom: `1px solid ${BORDER}` };
  const cellCenterStyle: React.CSSProperties = { ...cellStyle, textAlign: "center" };
  const thStyle: React.CSSProperties = { padding: "10px 14px", color: MUTED, fontSize: 12, fontWeight: 600, textAlign: ar ? "right" : "left", whiteSpace: "nowrap", backgroundColor: TH, borderBottom: `1px solid ${BORDER}` };
  const thCenterStyle: React.CSSProperties = { ...thStyle, textAlign: "center" };

  const modalConfig = modal ? {
    delete:     { color: "#EF4444", msg: t.confirmDelete,     label: t.delete },
    publish:    { color: "#00D26A", msg: t.confirmPublish,    label: t.publish },
    unpublish:  { color: "#F4B740", msg: t.confirmUnpublish,  label: t.unpublish },
  }[modal.type] : null;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <span style={{ color: MUTED, fontSize: 13 }}>{total} {t.results}</span>
      </div>

      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        {posts.length === 0 ? (
          <EmptyState message={t.noPosts} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>{t.cover}</th>
                  <th style={thStyle}>{t.title}</th>
                  <th style={thCenterStyle}>{t.category}</th>
                  <th style={thCenterStyle}>{t.lang}</th>
                  <th style={thCenterStyle}>{t.status}</th>
                  <th style={thCenterStyle}>{t.views}</th>
                  <th style={thCenterStyle}>{t.published}</th>
                  <th style={thStyle}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td style={cellStyle}>
                      <div style={{
                        width: 48, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                        backgroundColor: TH, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {post.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.coverImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <FileText size={16} color={MUTED} />
                        )}
                      </div>
                    </td>
                    <td style={{ ...cellStyle, maxWidth: 280 }}>
                      <Link href={`/admin/blog/${post.id}/edit`} style={{ color: TEXT, fontWeight: 600, textDecoration: "none" }}>
                        {post.title}
                      </Link>
                      <div style={{ color: MUTED, fontSize: 11, marginTop: 2, direction: "ltr", textAlign: ar ? "right" : "left" }}>/blog/{post.slug}</div>
                    </td>
                    <td style={cellCenterStyle}>{post.category}</td>
                    <td style={cellCenterStyle}>{post.lang.toUpperCase()}</td>
                    <td style={cellCenterStyle}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        backgroundColor: post.status === "published" ? "rgba(0,210,106,0.15)" : "rgba(148,163,184,0.15)",
                        color: post.status === "published" ? "#00D26A" : MUTED,
                      }}>
                        {post.status === "published" ? t.publishedStatus : t.draft}
                      </span>
                    </td>
                    <td style={{ ...cellCenterStyle, fontVariantNumeric: "tabular-nums" }}>{post.viewCount}</td>
                    <td style={{ ...cellCenterStyle, color: MUTED, whiteSpace: "nowrap" }}>
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(ar ? "ar-EG" : "en-US") : t.notPublished}
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Link href={`/admin/blog/${post.id}/edit`} title={t.edit} style={{ color: "#60A5FA", display: "flex", padding: 4 }}>
                          <Pencil size={16} />
                        </Link>
                        {post.status === "published" && (
                          <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" title={t.view} style={{ color: MUTED, display: "flex", padding: 4 }}>
                            <ExternalLink size={16} />
                          </Link>
                        )}
                        <button
                          onClick={() => setModal({ type: post.status === "published" ? "unpublish" : "publish", post })}
                          title={post.status === "published" ? t.unpublish : t.publish}
                          style={{ background: "none", border: "none", cursor: "pointer", color: post.status === "published" ? "#F4B740" : "#00D26A", padding: 4, display: "flex" }}
                        >
                          {post.status === "published" ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => setModal({ type: "delete", post })}
                          title={t.delete}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 4, display: "flex" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={page} totalPages={totalPages} buildHref={hrefFor} />

      {modal && modalConfig && (
        <ConfirmationModal
          open
          title={modalConfig.msg}
          confirmColor={modalConfig.color}
          confirmLabel={loading ? (ar ? "جاري..." : "Loading...") : modalConfig.label}
          onConfirm={() => runModalAction(modal)}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}
