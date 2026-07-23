export const runtime = "edge";
export const dynamic = "force-dynamic";

import { fetchCategories } from "@/features/categories/services/category.service";
import AdminCategoriesClient from "./_components/AdminCategoriesClient";

export default async function AdminCategoriesPage() {
  const categories = await fetchCategories(undefined, false);
  return <AdminCategoriesClient initialCategories={categories} />;
}
