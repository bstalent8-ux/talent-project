-- Phone OTP verification state (Twilio Verify). Stores only phone + when it
-- was verified — never the OTP code itself (Twilio owns code generation/
-- expiry). Keyed by E.164 phone since no auth.users row exists yet at
-- verify time (this runs before signUp). /api/profile checks this table
-- before creating a profile.
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  phone       text        PRIMARY KEY,
  verified_at timestamptz NOT NULL DEFAULT now()
);
-- No RLS: service-role only, same as contact_messages.
