export const runtime = 'edge';

import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function POST() {
  const results: Record<string, string> = {};

  // ── 1. Create conversations table ──────────────────────────────────────────
  // We can't run raw DDL via the JS client, so we detect existence via a query
  // and return the SQL the user should run in Supabase SQL editor if missing.
  const { error: convCheckErr } = await adminClient
    .from("conversations")
    .select("id")
    .limit(1);

  results["conversations_table"] = convCheckErr
    ? `MISSING — run SQL in Supabase dashboard`
    : "exists ✓";

  const { error: msgCheckErr } = await adminClient
    .from("messages")
    .select("id")
    .limit(1);

  results["messages_table"] = msgCheckErr
    ? `MISSING — run SQL in Supabase dashboard`
    : "exists ✓";

  const sqlToRun = `
-- ══════════════════════════════════════════════════════════
-- PASTE THIS IN YOUR SUPABASE SQL EDITOR (supabase.com/dashboard)
-- ══════════════════════════════════════════════════════════

create table if not exists conversations (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references profiles(id) on delete cascade,
  talent_id       uuid not null references profiles(id) on delete cascade,
  booking_id      uuid references bookings(id) on delete set null,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique(brand_id, talent_id)
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  content         text not null check (char_length(content) <= 10000),
  message_type    text not null default 'text' check (message_type in ('text','image','file')),
  created_at      timestamptz not null default now(),
  is_read         boolean not null default false
);

create index if not exists idx_messages_conv    on messages(conversation_id);
create index if not exists idx_messages_time    on messages(created_at);
create index if not exists idx_messages_unread  on messages(conversation_id, is_read) where is_read = false;
create index if not exists idx_conv_brand       on conversations(brand_id);
create index if not exists idx_conv_talent      on conversations(talent_id);
create index if not exists idx_conv_last        on conversations(last_message_at desc);

alter table conversations enable row level security;
alter table messages       enable row level security;

-- RLS: conversations
create policy if not exists conv_select on conversations for select
  using (auth.uid() = brand_id or auth.uid() = talent_id);
create policy if not exists conv_insert on conversations for insert
  with check (auth.uid() = brand_id or auth.uid() = talent_id);
create policy if not exists conv_update on conversations for update
  using (auth.uid() = brand_id or auth.uid() = talent_id);

-- RLS: messages
create policy if not exists msg_select on messages for select
  using (exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.brand_id = auth.uid() or c.talent_id = auth.uid())
  ));
create policy if not exists msg_insert on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.brand_id = auth.uid() or c.talent_id = auth.uid())
    )
  );
create policy if not exists msg_update on messages for update
  using (exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
      and (c.brand_id = auth.uid() or c.talent_id = auth.uid())
  ));

-- Realtime
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;
`;

  return NextResponse.json({ results, sql_to_run: sqlToRun });
}