export const runtime = 'edge';

import { redirect } from "next/navigation";

// Posting a job now happens from /community's post-type picker (the
// PostComposerModal, "job" mode) instead of this standalone form — same
// POST /api/jobs endpoint underneath.
export default function CreateJobPage() {
  redirect("/community");
}
