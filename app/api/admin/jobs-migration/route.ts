export const runtime = 'edge';

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function GET() {
  // Check if table exists
  const { error } = await adminClient.from("jobs").select("id").limit(1);
  const exists = !error;

  const sql = `
-- ══════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor → supabase.com/dashboard
-- ══════════════════════════════════════════════════════

create table if not exists jobs (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid not null references profiles(id) on delete cascade,
  title        text not null,
  description  text,
  category     text,
  budget_min   integer,
  budget_max   integer,
  currency     text not null default 'EGP',
  start_date   date,
  end_date     date,
  slots        integer not null default 1,
  status       text not null default 'open' check (status in ('open','closed','draft')),
  created_at   timestamptz not null default now()
);

create index if not exists idx_jobs_brand    on jobs(brand_id);
create index if not exists idx_jobs_status   on jobs(status);
create index if not exists idx_jobs_created  on jobs(created_at desc);

alter table jobs enable row level security;

-- Anyone can read open jobs
create policy if not exists jobs_select on jobs for select
  using (status = 'open' or auth.uid() = brand_id);

-- Only the brand owner can insert
create policy if not exists jobs_insert on jobs for insert
  with check (auth.uid() = brand_id);

-- Only the brand owner can update/delete
create policy if not exists jobs_update on jobs for update
  using (auth.uid() = brand_id);

create policy if not exists jobs_delete on jobs for delete
  using (auth.uid() = brand_id);
`;

  return NextResponse.json({ table_exists: exists, sql_to_run: sql });
}