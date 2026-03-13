-- Migration: Add email field to profiles table
-- This migration adds email column to the profiles table for storing user email addresses

-- Step 1: Add email column to profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN email TEXT;

-- Step 2: Create unique constraint on email (optional, uncomment if needed)
-- ALTER TABLE public.profiles
-- ADD CONSTRAINT profiles_email_unique UNIQUE(email);

-- Step 3: Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Migration completed
-- Note: If you need to migrate existing data, check auth.users table for emails
