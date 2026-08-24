-- Email OTP verification (register email-verify gate + login 2FA step).
-- Stores only a SHA-256 hash of the code, never the raw code. Keyed by
-- email + purpose (not user_id) because the register purpose runs before
-- any auth.users row exists.
CREATE TABLE IF NOT EXISTS public.email_otps (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  purpose     text        NOT NULL CHECK (purpose IN ('register','login')),
  code_hash   text        NOT NULL,
  attempts    int         NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup
  ON public.email_otps(email, purpose, created_at DESC);

-- No RLS policies: service-role only, same pattern as contact_messages /
-- user_events / phone_verifications.
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
