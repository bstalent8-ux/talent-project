export const runtime = 'edge';

import { Construction } from "lucide-react";
import { adminClient } from "@/lib/supabase/admin";
import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import JobsClient from "./_components/JobsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jobs | Talents",
  description: "Job posts from brands looking for UGC creators and models.",
};
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import styles from "./_components/JobsPage.module.css";

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

export default async function JobsPage() {
  const result = await cachedPublic(
    ["jobs-open-list"],
    [CACHE_TAGS.jobs.list],
    CACHE_SECONDS.fiveMinutes,
    async () => {
      const { data: jobs, error } = await adminClient
        .from("jobs")
        .select("id, brand_id, title, description, category, budget_min, budget_max, currency, start_date, end_date, slots, status, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) return { jobs: [] as JobPost[], error: error.message };

      const brandIds = [...new Set((jobs ?? []).map((j) => j.brand_id))];
      const { data: profiles } = brandIds.length
        ? await adminClient.from("profiles").select("id, full_name, handle, avatar_url, city, brand_status").in("id", brandIds)
        : { data: [] };

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
      return {
        // Reapply the same brand visibility rule the detail page enforces —
        // otherwise a listed job whose brand is pending/rejected 404s on click.
        jobs: (jobs ?? [])
          .filter((j) => {
            const brand = profileMap[j.brand_id];
            return brand && (!brand.brand_status || brand.brand_status === "approved");
          })
          .map((j) => {
            const { brand_status: _ignored, ...brand } = profileMap[j.brand_id];
            return { ...j, currency: j.currency ?? "EGP", brand };
          }) as JobPost[],
        error: null as string | null,
      };
    },
  );

  if (result.error) {
    // The `jobs` table has existed in production for a while now — this is
    // a generic fallback for an unexpected query failure, not a setup step.
    // (The old /api/admin/jobs-migration bootstrap route this used to point
    // at is gone — it was a one-time "table doesn't exist yet" helper.)
    return (
      <ComingSoonOverlay>
        <div className={styles.setupError}>
          <div className={styles.setupCard}>
            <span className={styles.setupIcon}><Construction size={26} /></span>
            <p className={styles.setupTitle}>Something went wrong loading jobs</p>
            <p className={styles.setupText}>Please try again shortly.</p>
          </div>
        </div>
      </ComingSoonOverlay>
    );
  }

  return (
    <ComingSoonOverlay>
      <JobsClient jobs={result.jobs} />
    </ComingSoonOverlay>
  );
}
