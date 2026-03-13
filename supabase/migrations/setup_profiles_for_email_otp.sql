-- Complete Profiles Table Migration for Email-OTP Authentication
-- This fixes the UNIQUE constraint on phone and adds email column

-- Step 1: Check if email column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT UNIQUE;
    CREATE INDEX idx_profiles_email ON public.profiles(email);
  END IF;
END $$;

-- Step 2: Remove UNIQUE constraint from phone column
-- This allows multiple users to have the same or no phone number

-- First check if the constraint exists before dropping
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- If there are any existing duplicate phone values, we need to handle them
-- This step is only needed if you have duplicate phones already
-- For a fresh database, this won't be needed

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Step 4: Disable RLS on profiles table so server can insert
-- This is important for the server-side operations with service role key
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Optional: Verify the schema
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;
