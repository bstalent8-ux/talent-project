-- Drop first to avoid duplicate error, then recreate
DROP POLICY IF EXISTS "users can read own profile" ON profiles;
CREATE POLICY "users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users can update own profile" ON profiles;
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users can insert own profile" ON profiles;
CREATE POLICY "users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
