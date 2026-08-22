import { fetchAdminTestimonials } from "@/features/admin/services/admin.service";
import AdminTestimonialsClient from "./AdminTestimonialsClient";

// Async Server Component — the only part of the page that suspends.
// Testimonials are admin-curated content (small, not user-signup-scale), so
// no pagination is needed here — just a loading state for the fetch itself.
export default async function TestimonialsSection() {
  const testimonials = await fetchAdminTestimonials();
  return <AdminTestimonialsClient testimonials={testimonials} />;
}
