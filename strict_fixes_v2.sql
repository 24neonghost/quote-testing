-- STRICT FIXES V2 - AGGRESSIVE RLS ENFORCEMENT
-- Execute this script to fix "All Quotations Visible" and "Admin Unauthorized" issues.

-- 1. QUOTATIONS TABLE
-- Force RLS to be on.
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations FORCE ROW LEVEL SECURITY; -- Strict enforcement

-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users view own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Admin view all quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can view own quotations only" ON public.quotations;
DROP POLICY IF EXISTS "Admin can view all quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can insert own quotations" ON public.quotations;

-- Policy: Users see ONLY their own quotations
CREATE POLICY "Users view own quotations"
ON public.quotations
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
);

-- Policy: Admins see ALL quotations
CREATE POLICY "Admin view all quotations"
ON public.quotations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Users can insert their own quotations
CREATE POLICY "Users insert own quotations"
ON public.quotations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

-- 2. PROFILES (USERS) TABLE
-- Force RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Admin full read access users" ON public.profiles;
DROP POLICY IF EXISTS "Admin full insert access users" ON public.profiles;
DROP POLICY IF EXISTS "Admin full update access users" ON public.profiles;
DROP POLICY IF EXISTS "Admin full delete access users" ON public.profiles;
DROP POLICY IF EXISTS "Admin read users" ON public.profiles;
DROP POLICY IF EXISTS "Admin insert users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Policy: Admin Full Access (Select, Insert, Update, Delete)
CREATE POLICY "Admin full access"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Users can view their own profile (Required for basic auth checks)
CREATE POLICY "Users view self"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- 3. PERMISSIONS REFRESH
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

NOTIFY pgrst, 'reload schema';
