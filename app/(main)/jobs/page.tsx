export const runtime = 'edge';

import { redirect } from "next/navigation";

// The standalone /jobs listing page is retired — job browsing/posting now
// lives inside /community alongside offers and stories (see the "Community
// Restructure Plan"). The backend this page used to read from (jobs,
// job_applications, the apply -> accept -> booking pipeline) is untouched —
// /community's job cards call the same /api/jobs endpoints. `JobPost` stays
// exported here because app/(main)/jobs/_components/ApplyModal.tsx (reused
// as-is by Community for the job-apply flow) still imports its shape from
// this file; it's a type-only declaration, erased at build, so keeping it
// costs nothing.
export interface JobPost {
  id: string;
  brand_id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  slots: number;
  status: string;
  created_at: string;
  brand: { id: string; full_name: string | null; handle: string | null; avatar_url: string | null; city: string | null } | null;
}

export default function JobsPage() {
  redirect("/community");
}
