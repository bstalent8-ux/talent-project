-- Trusted brands shown in the homepage "Trusted By" marquee.
-- Paste into the Supabase SQL editor. Idempotent by design.

create table if not exists public.trusted_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text null,
  website_url text null,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trusted_brands_is_active
  on public.trusted_brands (is_active);

create index if not exists idx_trusted_brands_display_order
  on public.trusted_brands (display_order);

create index if not exists idx_trusted_brands_active_order
  on public.trusted_brands (is_active, display_order);

alter table public.trusted_brands enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_trusted_brands_updated_at on public.trusted_brands;
create trigger set_trusted_brands_updated_at
before update on public.trusted_brands
for each row
execute function public.set_updated_at();

drop policy if exists "trusted brands public active select" on public.trusted_brands;
create policy "trusted brands public active select"
on public.trusted_brands
for select
using (is_active = true);

drop policy if exists "trusted brands admin select" on public.trusted_brands;
create policy "trusted brands admin select"
on public.trusted_brands
for select
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "trusted brands admin insert" on public.trusted_brands;
create policy "trusted brands admin insert"
on public.trusted_brands
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "trusted brands admin update" on public.trusted_brands;
create policy "trusted brands admin update"
on public.trusted_brands
for update
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "trusted brands admin delete" on public.trusted_brands;
create policy "trusted brands admin delete"
on public.trusted_brands
for delete
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

insert into public.trusted_brands (
  id,
  name,
  logo_url,
  website_url,
  display_order,
  is_active
)
values
  ('0c0d4f81-3df4-41e9-bd5b-1a7d72db8b01', 'Nile Studios', null, null, 10, true),
  ('184fa820-cba3-4c4f-8e19-9ab7124a6e52', 'Lotus Media', null, null, 20, true),
  ('27c1af56-0f80-4669-93f9-398808cb8f12', 'Cairo Collective', null, null, 30, true),
  ('3cb8cbd0-c60c-4652-b889-a5da6f78602c', 'Sahara Beauty', null, null, 40, true),
  ('4ed0d8e8-1455-4452-9172-696f17ea06d4', 'Delta Films', null, null, 50, true)
on conflict (id) do nothing;
