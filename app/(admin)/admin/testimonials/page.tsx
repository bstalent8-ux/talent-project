export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { fetchAdminTestimonials } from "@/features/admin/services/admin.service";
import AdminTestimonialsClient from "./_components/AdminTestimonialsClient";

export default async function AdminTestimonialsPage() {
  const testimonials = await fetchAdminTestimonials();
  return <AdminTestimonialsClient testimonials={testimonials} />;
}
