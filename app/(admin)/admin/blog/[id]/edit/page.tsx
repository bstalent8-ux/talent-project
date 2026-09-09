export const runtime = 'edge';

import { notFound } from "next/navigation";
import { fetchAdminBlogPost } from "@/features/blog/services/admin-blog.service";
import BlogForm from "../../_components/BlogForm";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await fetchAdminBlogPost(id);
  if (!post) notFound();
  return <BlogForm initialPost={post} />;
}
