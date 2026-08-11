export const runtime = 'edge';

import { Construction } from "lucide-react";
import { adminClient } from "@/lib/supabase/admin";
import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import JobsClient from "./_components/JobsClient";
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
    // Table doesn't exist yet — show setup message
    return (
      <div className={styles.setupError}>
        <div className={styles.setupCard}>
          <span className={styles.setupIcon}><Construction size={26} /></span>
          <p className={styles.setupTitle}>Jobs table not set up yet</p>
          <p className={styles.setupText}>Call GET /api/admin/jobs-migration to get the SQL, then run it in Supabase.</p>
          <a href="/api/admin/jobs-migration" className={styles.setupLink}>/api/admin/jobs-migration</a>
        </div>
      </div>
    );
  }

  return <JobsClient jobs={result.jobs} />;
}
