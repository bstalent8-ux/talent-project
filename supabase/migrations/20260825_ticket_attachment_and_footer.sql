-- ─── Optional screenshot on support tickets ────────────────────────────────
-- The quick ticket modal (register/login/footer) can now attach one image
-- of the problem — proxied through /api/support/tickets to Cloudinary, same
-- pattern as every other upload in the app (never a direct client upload,
-- CSP's connect-src only allows 'self' + supabase).

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS attachment_url text;

DO $$
BEGIN
  RAISE NOTICE 'contact_messages.attachment_url ready';
END $$;
