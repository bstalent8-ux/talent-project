-- ─── Password reset via email OTP ───────────────────────────────────────────
-- /forgot-password never existed as a real page — the login page linked to
-- it, but hitting it 404'd (known gap, see CLAUDE.md's Login section). Fixed
-- by reusing the existing email_otps table (register/login purposes already
-- there) with a third purpose instead of a new table or Supabase's own
-- magic-link email (which needs Site URL / redirect-allowlist configuration
-- this project hasn't set up) — same 6-digit-code UX the app already uses
-- for register, sent through the same Resend path.

ALTER TABLE public.email_otps DROP CONSTRAINT IF EXISTS email_otps_purpose_check;
ALTER TABLE public.email_otps ADD CONSTRAINT email_otps_purpose_check
  CHECK (purpose IN ('register', 'login', 'reset_password'));

DO $$
BEGIN
  RAISE NOTICE 'email_otps.purpose now also accepts reset_password';
END $$;
