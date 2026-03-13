-- Update Profiles Table for Email-OTP Authentication
-- This migration removes the UNIQUE constraint from phone and adds email column

-- 1. Add email column to profiles (if not already present)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Drop UNIQUE constraint from phone column (allow duplicate phone numbers)
-- First, create a temporary column
ALTER TABLE public.profiles ADD COLUMN phone_temp TEXT;

-- Copy data from phone to phone_temp
UPDATE public.profiles SET phone_temp = phone;

-- Drop the old phone column with UNIQUE constraint
ALTER TABLE public.profiles DROP COLUMN phone CASCADE;

-- Rename phone_temp to phone (without UNIQUE)
ALTER TABLE public.profiles RENAME COLUMN phone_temp TO phone;

-- 3. Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. Create index for phone lookups (optional, for faster queries)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Verify the schema
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles';
