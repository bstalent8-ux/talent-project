export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import JobDetailClient from "./_components/JobDetailClient";
import type { JobPost } from "../page";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: job } = await adminClient
    .from("jobs")
    .select("id, brand_id, title, description, category, budget_min, budget_max, currency, start_date, end_date, slots, status, created_at")
    .eq("id", id)
    .eq("status", "open")
    .maybeSingle();

  if (!job) notFound();

  const { data: brand } = await adminClient
    .from("profiles")
    .select("id, full_name, handle, avatar_url, city, brand_status, account_status")
    .eq("id", job.brand_id)
    .maybeSingle();

  if (!brand) notFound();
  if (brand.account_status && ["blocked", "suspended", "rejected"].includes(brand.account_status)) notFound();
  if (brand.brand_status && brand.brand_status !== "approved") notFound();

  return (
    <JobDetailClient
      job={{
        ...job,
        currency: job.currency ?? "EGP",
        brand: {
          id: brand.id,
          full_name: brand.full_name ?? null,
          handle: brand.handle ?? null,
          avatar_url: brand.avatar_url ?? null,
          city: brand.city ?? null,
        },
      } as JobPost}
    />
  );
}
