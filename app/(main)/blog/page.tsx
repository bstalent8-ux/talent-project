export const runtime = 'edge';

import type { Metadata } from "next";
import BlogClient from "./_components/BlogClient";

export const metadata: Metadata = {
  title: "المدونة — Talents | Blog",
  description: "Tips, insights, and news for brands and Arabic content creators.",
};

export default function BlogPage() {
  return <BlogClient />;
}
