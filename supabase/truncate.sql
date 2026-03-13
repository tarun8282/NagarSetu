-- Truncate all data from NagarSetu database
-- WARNING: This will delete ALL data. Use with caution in development only!

-- Disable foreign key constraints temporarily
ALTER TABLE public.status_history DISABLE TRIGGER ALL;
ALTER TABLE public.ai_classifications DISABLE TRIGGER ALL;
ALTER TABLE public.complaint_media DISABLE TRIGGER ALL;
ALTER TABLE public.complaints DISABLE TRIGGER ALL;
ALTER TABLE public.officers DISABLE TRIGGER ALL;
ALTER TABLE public.citizens DISABLE TRIGGER ALL;
ALTER TABLE public.departments DISABLE TRIGGER ALL;
ALTER TABLE public.cities DISABLE TRIGGER ALL;
ALTER TABLE public.otp_tokens DISABLE TRIGGER ALL;

-- Truncate all tables
TRUNCATE public.status_history CASCADE;
TRUNCATE public.ai_classifications CASCADE;
TRUNCATE public.complaint_media CASCADE;
TRUNCATE public.complaints CASCADE;
TRUNCATE public.officers CASCADE;
TRUNCATE public.citizens CASCADE;
TRUNCATE public.departments CASCADE;
TRUNCATE public.cities CASCADE;
TRUNCATE public.states CASCADE;
TRUNCATE public.otp_tokens CASCADE;

-- Re-enable triggers
ALTER TABLE public.status_history ENABLE TRIGGER ALL;
ALTER TABLE public.ai_classifications ENABLE TRIGGER ALL;
ALTER TABLE public.complaint_media ENABLE TRIGGER ALL;
ALTER TABLE public.complaints ENABLE TRIGGER ALL;
ALTER TABLE public.officers ENABLE TRIGGER ALL;
ALTER TABLE public.citizens ENABLE TRIGGER ALL;
ALTER TABLE public.departments ENABLE TRIGGER ALL;
ALTER TABLE public.cities ENABLE TRIGGER ALL;
ALTER TABLE public.otp_tokens ENABLE TRIGGER ALL;
