-- ══════════════════════════════════════════════════════════════════════════
-- LIVE SCHEMA SNAPSHOT — objects the code depends on that drifted away from
-- this folder and caused silent production bugs (CLAUDE.md §6).      2026-09-10
-- ══════════════════════════════════════════════════════════════════════════
-- This file is a version-controlled record of the CURRENT live shape of the
-- drifted objects, reconstructed by probing the production database. It is
-- fully idempotent: run it against production (every statement no-ops) or
-- against a fresh Supabase project (it bootstraps these objects).
--
-- `scripts/schema-audit.mjs` (npm run db:schema-audit, also a CI step) checks
-- that every one of these still exists in the live DB on each push.
--
-- What lives here and why:
--   payments        — escrow shape; the 2026-09-09 "paid" bug and the
--                     2026-09-10 frozen-status-trigger bug both lived here.
--   increment_balance / rl_hit — RPCs the app calls, added by hand-run
--                     migrations that were never pasted (fixed 2026-09-10).
--   rate_limits     — P0 spam throttle backing store.
--   leads.channel_id / category_id + lead_channels / lead_categories —
--                     20260907_leads_channel_category.sql, still outstanding
--                     as of this file; included so the audit tracks it.
-- ══════════════════════════════════════════════════════════════════════════


-- ─── payments (escrow) ──────────────────────────────────────────────────────
-- platform_fee / talent_payout are a 10 / 90 split of amount, computed by the
-- DB (observed live: amount 3000 -> fee 300, payout 2700). status and
-- payment_method are CHECK-constrained to the values below — NOT "paid",
-- NOT "instapay"/"bank_transfer".
CREATE TABLE IF NOT EXISTS public.payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  client_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  talent_id      uuid REFERENCES public.talent_profiles(id) ON DELETE SET NULL,
  amount         numeric NOT NULL,
  platform_fee   numeric GENERATED ALWAYS AS (round(amount * 0.10, 2)) STORED,
  talent_payout  numeric GENERATED ALWAYS AS (round(amount * 0.90, 2)) STORED,
  currency       text NOT NULL DEFAULT 'EGP',
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  payment_method text NOT NULL DEFAULT 'offline'
                   CHECK (payment_method IN ('offline', 'wallet', 'card', 'stripe', 'paymob')),
  external_ref   text,
  proof_url      text,
  admin_note     text,
  held_at        timestamptz,
  released_at    timestamptz,
  refunded_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS proof_url text;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- The notifications trigger that used to sit on this table (and froze every
-- status change with `column "user_id" of relation "notifications" does not
-- exist`) was DROPPED by 20260910_p0_payments_unblock.sql. The app sends
-- payment notifications itself. Do not re-add a notification trigger here.


-- ─── increment_balance(uuid, numeric) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_balance(user_id uuid, amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET balance = COALESCE(balance, 0) + amount WHERE id = user_id;
END; $$;
REVOKE ALL ON FUNCTION public.increment_balance(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_balance(uuid, numeric) TO service_role;


-- ─── rate limiting (rate_limits + rl_hit) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket       text        NOT NULL,
  window_start timestamptz NOT NULL,
  count        integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.rl_hit(p_bucket text, p_window_seconds integer, p_max_hits integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w_start timestamptz; new_count integer;
BEGIN
  w_start := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  INSERT INTO public.rate_limits (bucket, window_start, count) VALUES (p_bucket, w_start, 1)
  ON CONFLICT (bucket, window_start) DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO new_count;
  DELETE FROM public.rate_limits WHERE bucket = p_bucket AND window_start < w_start;
  RETURN new_count <= p_max_hits;
END; $$;
REVOKE ALL ON FUNCTION public.rl_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rl_hit(text, integer, integer) TO service_role;


-- ─── leads CRM taxonomies (20260907_leads_channel_category.sql) ─────────────
-- OUTSTANDING as of 2026-09-10 — the leads admin table's Channel / Category
-- columns and filters are inert until this runs.
CREATE TABLE IF NOT EXISTS public.lead_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE, label_ar text NOT NULL, label_en text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.lead_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE, label_ar text NOT NULL, label_en text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_channels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS channel_id  uuid REFERENCES public.lead_channels(id)  ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.lead_categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_channel_id  ON public.leads(channel_id);
CREATE INDEX IF NOT EXISTS idx_leads_category_id ON public.leads(category_id);


DO $$ BEGIN RAISE NOTICE 'schema snapshot applied — run `npm run db:schema-audit` to confirm.'; END $$;
