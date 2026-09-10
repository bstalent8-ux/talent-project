import { fetchAdminBlogPage } from "@/features/blog/services/admin-blog.service";
import BlogTable from "./BlogTable";

export default async function BlogSection({ page, pageSize, status, sort, dir }: { page: number; pageSize: number; status: string; sort?: string; dir?: "asc" | "desc" }) {
  const { posts, total } = await fetchAdminBlogPage({ page, pageSize, status, sort, dir });
  return <BlogTable posts={posts} total={total} page={page} pageSize={pageSize} status={status} sort={sort} dir={dir} />;
}
