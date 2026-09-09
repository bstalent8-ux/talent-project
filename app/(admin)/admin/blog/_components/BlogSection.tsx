import { fetchAdminBlogPage } from "@/features/blog/services/admin-blog.service";
import BlogTable from "./BlogTable";

export default async function BlogSection({ page, pageSize, status }: { page: number; pageSize: number; status: string }) {
  const { posts, total } = await fetchAdminBlogPage({ page, pageSize, status });
  return <BlogTable posts={posts} total={total} page={page} pageSize={pageSize} status={status} />;
}
