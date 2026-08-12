-- ============================================================
-- 20260812_01b_talent_category_enum_model.sql
-- Sprint 1 (Profile Category Foundation) — incident repair, step 1B.
--
-- Root cause of the 20260812_02 failure (ERROR 42804): talent_profiles
-- .category is the Postgres ENUM `public.talent_category`, not text.
-- categories.id is text. A direct FK between an enum column and a text
-- column is rejected by Postgres at ALTER TABLE time — this was never a
-- data problem, it is a type-system mismatch that 20260812_02 (v1) did not
-- account for.
--
-- 'model' was added to the `categories` table by 20260812_01, but
-- `categories` and `talent_category` are two independent type systems that
-- happen to share some labels (fashion, ugc) and diverge on others
-- (talent_category also has makeup/kids/commercial/parts, which have no
-- `categories` row at all; `categories` also has influencer/food_reviewer/
-- tech_reviewer/unboxing/host, none of which are members of
-- talent_category). See the compatibility matrix in
-- docs/audits/sprint1-db-baseline-before.txt's follow-up audit for the
-- full picture — this file's job is narrowly to make 'model' writable to
-- talent_profiles.category; it does not attempt to reconcile the two
-- taxonomies, which is a separate, larger decision (do not invent
-- categories here).
--
-- THIS FILE MUST BE RUN AS ITS OWN SQL EDITOR PASTE, SEPARATELY FROM ANY
-- OTHER STATEMENT. Postgres forbids using a newly-added enum value inside
-- the same transaction block that added it (the simple-query protocol
-- Supabase's SQL editor uses treats one multi-statement paste as a single
-- implicit transaction). This file's own verification queries are written
-- to only ever read `pg_enum.enumlabel` as plain text — never to cast the
-- literal 'model' to `talent_category` — so they are safe to run in the
-- same paste as the ALTER TYPE. Migration 02 (which does need to compare
-- against 'model'::talent_category indirectly via text casts of the
-- column, not the literal) is always issued as a separate, later paste;
-- by then this transaction has long committed.
--
-- ADDITIVE ONLY. No existing enum label is removed or reordered.
-- ALTER TYPE ... ADD VALUE IF NOT EXISTS is idempotent by construction.
-- ============================================================

ALTER TYPE public.talent_category ADD VALUE IF NOT EXISTS 'model';

-- ─── Verification (safe: text-only comparisons, no enum cast of a literal) ──
DO $$
DECLARE
  label_count integer;
BEGIN
  SELECT count(*) INTO label_count
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
   WHERE t.typname = 'talent_category'
     AND e.enumlabel = 'model';

  IF label_count <> 1 THEN
    RAISE EXCEPTION '20260812_01B failed: model is not a member of public.talent_category';
  END IF;

  RAISE NOTICE 'OK 20260812_01B: model is now a member of public.talent_category';
END $$;

-- Full live enum membership, for the record.
SELECT e.enumlabel, e.enumsortorder
  FROM pg_enum e
  JOIN pg_type t ON t.oid = e.enumtypid
 WHERE t.typname = 'talent_category'
 ORDER BY e.enumsortorder;

-- ─── STOP CONDITION ──────────────────────────────────────────────────────────
-- Do not paste 20260812_02 (revised) into the same SQL Editor tab/run as this
-- file. Run this file, confirm the NOTICE and the enum listing above show
-- 'model', THEN start a new query in a new run for 20260812_02.
