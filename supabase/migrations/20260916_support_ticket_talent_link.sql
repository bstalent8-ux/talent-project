-- ─── Link a support ticket to the talent it's about ────────────────────────
-- An admin can now raise a complaint/ticket ABOUT a specific talent from the
-- talents table or that talent's edit page (name/phone/email pre-filled from
-- the talent's own record), instead of every contact_messages row only ever
-- being self-reported by whoever hit Send. talent_id records which talent
-- the ticket concerns; ON DELETE SET NULL so the ticket (and its history)
-- survives a talent profile being deleted later.

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS talent_id uuid REFERENCES public.talent_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contact_messages_talent_id
  ON public.contact_messages(talent_id) WHERE talent_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE 'contact_messages.talent_id ready';
END $$;
