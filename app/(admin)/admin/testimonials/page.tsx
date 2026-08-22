export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminTestimonialsShell from "./_components/AdminTestimonialsShell";
import TestimonialsSection from "./_components/TestimonialsSection";
import TestimonialsSkeleton from "./_components/TestimonialsSkeleton";

export default function AdminTestimonialsPage() {
  return (
    <AdminTestimonialsShell>
      <Suspense fallback={<TestimonialsSkeleton />}>
        <TestimonialsSection />
      </Suspense>
    </AdminTestimonialsShell>
  );
}
