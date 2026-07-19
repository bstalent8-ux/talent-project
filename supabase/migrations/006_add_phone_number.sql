-- Add phone_number to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- Existing users: calculate completion dynamically (no data migration needed)
-- The completion is always calculated at runtime from profile fields
