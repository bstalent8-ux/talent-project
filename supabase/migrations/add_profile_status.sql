-- Account-level status on profiles (applies to ALL roles: talent, brand, client)
-- Distinct from talent_profiles.status (which is the approval workflow)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS blocked_at     timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_by     uuid,
  ADD COLUMN IF NOT EXISTS block_reason   text;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);

-- All existing users are active
UPDATE profiles SET account_status = 'active' WHERE account_status IS NULL;
