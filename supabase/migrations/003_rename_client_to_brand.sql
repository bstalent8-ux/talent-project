-- ============================================================
-- 003_rename_client_to_brand.sql
-- Renames role 'client' → 'brand' in the user_role enum
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Add 'brand' to the enum (if not already there)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'brand';

-- Step 2: Update all existing 'client' rows to 'brand'
UPDATE public.profiles
  SET role = 'brand'
  WHERE role = 'client';

-- Step 3: (Optional) If you want to remove 'client' from the enum,
-- that requires recreating it. Skip for now — unused values in an
-- enum are harmless. Re-run after confirming all rows are updated:
--
--   SELECT role, count(*) FROM public.profiles GROUP BY role;
--
-- If count of 'client' = 0, you can safely leave the enum as-is.

-- ============================================================
-- DONE. Verify with:
--   SELECT role, count(*) FROM public.profiles GROUP BY role;
-- ============================================================
