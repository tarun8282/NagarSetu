-- ========================================
-- SUPABASE DATABASE MIGRATION SCRIPT
-- Password-Based Authentication Setup
-- ========================================
-- Execute these commands in order in Supabase SQL Editor
-- ========================================

-- ========== STEP 1: ALTER PROFILES TABLE ==========
-- Remove UNIQUE constraint from phone and add email column

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_phone_key;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ========== STEP 2: UPDATE ROW LEVEL SECURITY (RLS) ==========

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Service role (backend) can create profiles during registration
DROP POLICY IF EXISTS "Service role can create profiles" ON public.profiles;
CREATE POLICY "Service role can create profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Service role can read all profiles for admin operations
DROP POLICY IF EXISTS "Service role can read profiles" ON public.profiles;
CREATE POLICY "Service role can read profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'service_role');

-- ========== STEP 3: CREATE/UPDATE TRIGGERS ==========

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========== STEP 4: VERIFICATION QUERIES ==========
-- Run these to verify everything is set up correctly

-- Check if email column exists and has unique constraint
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('email', 'phone');

-- Check RLS policies
SELECT 
  policyname, 
  permissive, 
  cmd 
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- Check if indices exist
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexname LIKE 'idx_%';

-- Sample: Count users by role
SELECT 
  role, 
  COUNT(*) as count 
FROM public.profiles 
GROUP BY role;

-- ========== STEP 5: OPTIONAL - CREATE USER STATS VIEW ==========

CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'citizen' THEN 1 END) as citizen_count,
  COUNT(CASE WHEN role = 'dept_officer' THEN 1 END) as officer_count,
  COUNT(CASE WHEN role = 'mc_admin' THEN 1 END) as mc_admin_count,
  COUNT(CASE WHEN role = 'state_admin' THEN 1 END) as state_admin_count,
  NOW() as last_calculated
FROM public.profiles;

-- Query the stats view
SELECT * FROM public.user_stats;

-- ========== NOTES ==========
-- 
-- 1. Run STEP 1, 2, 3 in order
-- 2. Run verification queries to confirm everything worked
-- 3. STEP 5 is optional but helpful for admin dashboards
-- 4. If you get "MUST NOT contain DEFAULT expression" errors, 
--    your version of PostgreSQL doesn't support IF NOT EXISTS for columns
--    In that case, comment out those lines and run the table creation manually
-- 5. To create admin users:
--    a) Use Supabase Dashboard → Authentication → Users to create auth user
--    b) Then insert into profiles table with role = 'mc_admin' or 'state_admin'
--
-- ========================================
