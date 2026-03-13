-- WARNING: This will drop existing tables and data!
DROP TABLE IF EXISTS public.status_history CASCADE;
DROP TABLE IF EXISTS public.ai_classifications CASCADE;
DROP TABLE IF EXISTS public.complaint_media CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.officers CASCADE;
DROP TABLE IF EXISTS public.citizens CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.states CASCADE;

-- 1. States Table
CREATE TABLE public.states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Cities Table
CREATE TABLE public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID REFERENCES public.states(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    official_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Departments Table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    helpline TEXT,
    email TEXT,
    sla_hours INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Citizens Table (Extends Auth.Users)
CREATE TABLE public.citizens (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    state_id UUID REFERENCES public.states(id),
    city_id UUID REFERENCES public.cities(id),
    ward_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for Citizens
CREATE INDEX IF NOT EXISTS idx_citizens_email ON public.citizens(email);
CREATE INDEX IF NOT EXISTS idx_citizens_phone ON public.citizens(phone);

-- 4b. Officers & Admins Table (Standalone — username/password auth, not via auth.users)
CREATE TABLE public.officers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    username TEXT UNIQUE,
    password TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('dept_officer', 'mc_admin', 'state_admin')),
    state_id UUID REFERENCES public.states(id),
    city_id UUID REFERENCES public.cities(id),
    department_id UUID REFERENCES public.departments(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_officers_username ON public.officers(username);

-- 5. Complaints Table
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number TEXT UNIQUE NOT NULL,
    citizen_id UUID REFERENCES public.citizens(id),
    title TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    city_id UUID REFERENCES public.cities(id),
    state_id UUID REFERENCES public.states(id),
    ward_number TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'ai_processing', 'under_review', 'in_progress', 'resolved', 'rejected', 'escalated')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category TEXT,
    assigned_department_id UUID REFERENCES public.departments(id),
    assigned_officer_id UUID REFERENCES public.officers(id),
    citizen_rating INTEGER CHECK (citizen_rating >= 1 AND citizen_rating <= 5),
    sla_deadline TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Complaint Media Table
CREATE TABLE public.complaint_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    is_video BOOLEAN DEFAULT false,
    is_resolution_proof BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. AI Classifications Table
CREATE TABLE public.ai_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    category TEXT,
    severity TEXT,
    department_name TEXT,
    authority_contact JSONB,
    reasoning TEXT,
    confidence_score DOUBLE PRECISION,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Status History Table (Audit Log)
CREATE TABLE public.status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    changed_by UUID REFERENCES auth.users(id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Citizens & Officers RLS
CREATE POLICY "Public citizens viewable by everyone" ON public.citizens FOR SELECT USING (true);
CREATE POLICY "Users can update own citizen profile" ON public.citizens FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable insert for authenticated users only" ON public.citizens FOR INSERT WITH CHECK (true);

CREATE POLICY "Public officers viewable by everyone" ON public.officers FOR SELECT USING (true);
CREATE POLICY "Users can update own officer profile" ON public.officers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable insert for all" ON public.officers FOR INSERT WITH CHECK (true);

-- Complaints:
-- Citizens: See only their own
CREATE POLICY "Citizens can view own complaints" ON public.complaints FOR SELECT
USING (auth.uid() = citizen_id);

-- Dept Officers: See complaints in their city and department
CREATE POLICY "Officers can view complaints in their dept" ON public.complaints FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.officers
    WHERE id = auth.uid()
    AND role = 'dept_officer'
    AND city_id = public.complaints.city_id
    AND department_id = public.complaints.assigned_department_id
  )
);

-- MC Admin: See complaints in their city
CREATE POLICY "MC Admins can view all complaints in city" ON public.complaints FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.officers
    WHERE id = auth.uid()
    AND role = 'mc_admin'
    AND city_id = public.complaints.city_id
  )
);

-- State Admin: See complaints in their state
CREATE POLICY "State Admins can view all complaints in state" ON public.complaints FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.officers
    WHERE id = auth.uid()
    AND role = 'state_admin'
    AND state_id = public.complaints.state_id
  )
);

-- Insert policy for citizens
CREATE POLICY "Citizens can insert complaints" ON public.complaints FOR INSERT
WITH CHECK (auth.uid() = citizen_id);

-- Update policy for officers and admins
CREATE POLICY "Officers and Admins can update complaints" ON public.complaints FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.officers
    WHERE id = auth.uid()
    AND role IN ('dept_officer', 'mc_admin')
  )
);

-- Enable Realtime
-- Note: In Supabase, this is often done via the dashboard, but can be done via SQL
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;

-- OTP Tokens Table
CREATE TABLE public.otp_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,    -- 10 minutes
    verified_at TIMESTAMPTZ,            -- null until verified
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ALTER: Add username & password to states
ALTER TABLE public.states
  ADD COLUMN username TEXT UNIQUE,
  ADD COLUMN password TEXT;

-- ALTER: Add username & password to cities
ALTER TABLE public.cities
  ADD COLUMN username TEXT UNIQUE,
  ADD COLUMN password TEXT;

-- Alerts Table (from main branch)
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    location TEXT,
    source TEXT,
    "publishedAt" TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);