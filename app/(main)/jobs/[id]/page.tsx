export const runtime = 'edge';

import { notFound } from "next/navigation";
import { CACHE_SECONDS, CACHE_TAGS, cachedPublic } from "@/lib/cache";
import { adminClient } from "@/lib/supabase/admin";
import JobDetailClient from "./_components/JobDetailClient";
import type { JobPost } from "../page";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const job = await cachedPublic(
    ["job-detail", id],
    [CACHE_TAGS.jobs.detail(id), CACHE_TAGS.jobs.list],
    CACHE_SECONDS.fiveMinutes,
    async () => {
      const { data: row } = await adminClient
        .from("jobs")
        .select("id, brand_id, title, description, category, budget_min, budget_max, currency, start_date, end_date, slots, status, created_at")
        .eq("id", id)
        .eq("status", "open")
        .maybeSingle();

      if (!row) return null;

      const brandAttempts = [
        "id, full_name, handle, avatar_url, city, brand_status, account_status",
        "id, full_name, handle, avatar_url, city, brand_status",
        "id, full_name, handle, avatar_url, city",
      ];

      for (const select of brandAttempts) {
        const { data: brand, error } = await adminClient
          .from("profiles")
          .select(select)
          .eq("id", row.brand_id)
          .maybeSingle();

        if (error?.code === "42703") continue;
        if (error || !brand) return null;
        const publicBrand = brand as unknown as {
          id: string;
          full_name?: string | null;
          handle?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          brand_status?: string | null;
          account_status?: string | null;
        };
        if (publicBrand.account_status && ["blocked", "suspended", "rejected"].includes(publicBrand.account_status)) return null;
        if (publicBrand.brand_status && publicBrand.brand_status !== "approved") return null;

        return {
          ...row,
          currency: row.currency ?? "EGP",
          brand: {
            id: publicBrand.id,
            full_name: publicBrand.full_name ?? null,
            handle: publicBrand.handle ?? null,
            avatar_url: publicBrand.avatar_url ?? null,
            city: publicBrand.city ?? null,
          },
        } as JobPost;
      }

      return null;
    },
  );

  if (!job) notFound();

  return (
    <JobDetailClient job={job} />
  );
}
