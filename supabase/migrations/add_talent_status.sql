-- Add approval workflow columns to talent_profiles
ALTER TABLE talent_profiles
  ADD COLUMN IF NOT EXISTS status          text        NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at     timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by     uuid        REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Index for fast filtering by status in explore / search
CREATE INDEX IF NOT EXISTS idx_talent_profiles_status ON talent_profiles(status);

-- Set all EXISTING talents to approved so the live site keeps working
UPDATE talent_profiles SET status = 'approved' WHERE status = 'pending';
