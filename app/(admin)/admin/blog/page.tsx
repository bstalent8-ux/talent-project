export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminBlogShell from "./_components/AdminBlogShell";
import BlogSection from "./_components/BlogSection";
import BlogSkeleton from "./_components/BlogSkeleton";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminBlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = typeof sp.status === "string" ? sp.status : "all";
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const dir = sp.dir === "asc" || sp.dir === "desc" ? sp.dir : undefined;

  return (
    <AdminBlogShell status={status}>
      <Suspense key={`${page}-${status}-${sort}-${dir}`} fallback={<BlogSkeleton />}>
        <BlogSection page={page} pageSize={PAGE_SIZE} status={status} sort={sort} dir={dir} />
      </Suspense>
    </AdminBlogShell>
  );
}
