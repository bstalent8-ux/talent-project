-- ─── Repair broken auth.users ↔ profiles linkage for @talents-test.com ────
-- 10 seed/demo accounts (nour-hassan, ahmed-brands, maya-khaled, and 7
-- others — see the pairs list below) currently have a `profiles` row whose
-- id does NOT match the id of the auth.users row that email actually logs
-- into today. Their auth.users rows were recreated at some point (new
-- random id assigned by Supabase on re-creation) while the OLD profiles
-- row — with all its real seeded data (Nour's portfolio, reviews, brands,
-- etc.) — was never re-pointed, leaving it orphaned under a dead id.
-- Symptom: signing in as any of these emails hits /api/me's self-heal path,
-- which fails silently (the handle is already taken by the orphaned row)
-- and returns 404 "profile not found".
--
-- Fix per (old_profile_id, new_auth_id) pair, all inside one transaction:
--   1. Free the old row's `handle` (UNIQUE, NOT NULL) with a throwaway
--      suffix so the real handle is available for step 2.
--   2. Copy the old row to new_auth_id via jsonb_populate_record — avoids
--      hand-listing every profiles column, survives future column changes.
--   3. Re-point every FK in the public schema that references profiles(id)
--      from old_profile_id to new_auth_id, found dynamically via
--      pg_constraint so no dependent table is missed.
--   4. Delete the now-childless old row.
-- Order matters: the new row must exist before any FK points at it, and no
-- row can be deleted while a FK still references it.

DO $$
DECLARE
  v_pairs jsonb := '[
    {"old": "304d0ad5-9953-4e15-a857-2f59440b859f", "new": "6ad8b09e-62b4-4efd-b3b1-498714b75098", "label": "maya-khaled"},
    {"old": "58398803-c9e5-44e2-8829-538bcb75c757", "new": "e58de4fc-ed33-4579-bd6a-3ad431ffb3ca", "label": "nour-hassan"},
    {"old": "5f888c0a-d4c5-49c0-9868-62be6a89555c", "new": "5c2f7904-87b6-4047-bc12-e93ef7ed3370", "label": "layla-ahmed"},
    {"old": "805838b9-34fe-41b2-b820-0ebba369938e", "new": "f0f264d0-30ae-48d4-bf7f-19abab38891a", "label": "sara-mostafa"},
    {"old": "b4807ee7-b141-47fe-b67a-ebaab8f31a5d", "new": "3b573d84-2dff-46ad-8d97-e11c79b5d0e7", "label": "rana-tarek"},
    {"old": "3cbd7e80-acec-4057-aabb-e99d916528ed", "new": "bc75f4ea-9568-4148-bf6f-f9630988d468", "label": "ahmed-brands"},
    {"old": "163f456b-0049-4927-bf75-05b4bbb5b6be", "new": "fbbc6aca-296e-492c-9ff5-50109aec8391", "label": "sara-marketing"},
    {"old": "c8419e18-4863-4b69-8877-de6581fc828e", "new": "3bf18f9c-b28d-4d2e-9216-f2b99bf75256", "label": "omar-digital"},
    {"old": "9ccd8fac-7056-4dec-962a-f9b633f98836", "new": "c3fec00f-5daa-4bf1-ba7b-508c88a82520", "label": "mona-agency"},
    {"old": "0529cdb6-f13b-4ace-ba2f-06e2a76b033b", "new": "a4beaa92-8c1a-4392-b297-752e59ca8794", "label": "youssef-corp"}
  ]'::jsonb;
  v_pair record;
  v_old uuid;
  v_new uuid;
  v_row jsonb;
  v_fk record;
  v_moved int;
BEGIN
  FOR v_pair IN SELECT * FROM jsonb_to_recordset(v_pairs) AS x(old uuid, "new" uuid, label text) LOOP
    v_old := v_pair.old;
    v_new := v_pair."new";

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_old) THEN
      RAISE NOTICE '% : old profile % already gone, skipping (already repaired)', v_pair.label, v_old;
      CONTINUE;
    END IF;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_new) THEN
      RAISE NOTICE '% : a profile already exists at %, skipping (already repaired)', v_pair.label, v_new;
      CONTINUE;
    END IF;

    SELECT to_jsonb(p) INTO v_row FROM public.profiles p WHERE p.id = v_old;

    -- Free handle + email (both UNIQUE) on the old row so the copy below
    -- can take the real values — the new row keeps them as-is via v_row,
    -- only id/auth_user_id are overridden per-row further down.
    UPDATE public.profiles
       SET handle = handle || '_stale_' || left(md5(random()::text), 6),
           email  = CASE WHEN email IS NOT NULL THEN 'stale_' || left(md5(random()::text), 8) || '_' || email ELSE email END
     WHERE id = v_old;

    -- profiles.auth_user_id is an undocumented, unused-by-app-code legacy
    -- column (see project_context.md) with its own UNIQUE constraint. It
    -- was set equal to `id` at creation time, so it must move with it too
    -- or the insert below collides with the still-present old row.
    INSERT INTO public.profiles
    SELECT (jsonb_populate_record(NULL::public.profiles, v_row || jsonb_build_object('id', v_new, 'auth_user_id', v_new))).*;

    FOR v_fk IN
      SELECT c.conrelid::regclass::text AS tbl, a.attname AS col
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      WHERE c.contype = 'f'
        AND c.confrelid = 'public.profiles'::regclass
        AND array_length(c.conkey, 1) = 1
    LOOP
      EXECUTE format('UPDATE %s SET %I = %L WHERE %I = %L', v_fk.tbl, v_fk.col, v_new, v_fk.col, v_old);
      GET DIAGNOSTICS v_moved = ROW_COUNT;
      IF v_moved > 0 THEN
        RAISE NOTICE '% : moved % row(s) in %.%', v_pair.label, v_moved, v_fk.tbl, v_fk.col;
      END IF;
    END LOOP;

    DELETE FROM public.profiles WHERE id = v_old;
    RAISE NOTICE '% : repaired, % -> %', v_pair.label, v_old, v_new;
  END LOOP;
END $$;

-- Verification: none of the old (dead) ids should remain in profiles.
DO $$
DECLARE v_old_ids uuid[] := ARRAY[
  '304d0ad5-9953-4e15-a857-2f59440b859f','58398803-c9e5-44e2-8829-538bcb75c757',
  '5f888c0a-d4c5-49c0-9868-62be6a89555c','805838b9-34fe-41b2-b820-0ebba369938e',
  'b4807ee7-b141-47fe-b67a-ebaab8f31a5d','3cbd7e80-acec-4057-aabb-e99d916528ed',
  '163f456b-0049-4927-bf75-05b4bbb5b6be','c8419e18-4863-4b69-8877-de6581fc828e',
  '9ccd8fac-7056-4dec-962a-f9b633f98836','0529cdb6-f13b-4ace-ba2f-06e2a76b033b'
];
v_remaining int;
BEGIN
  SELECT count(*) INTO v_remaining FROM public.profiles WHERE id = ANY(v_old_ids);
  RAISE NOTICE 'old orphaned ids still present in profiles: % (expect 0)', v_remaining;
END $$;
