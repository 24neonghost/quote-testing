-- EMERGENCY FIX v5 - RECOVER VISIBILITY
-- Fixes "All quotations gone" and "Admin dashboard empty"

-- 1. Redefine is_admin to accept user_id explicitly (safer in RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

-- 2. Quotations Policy Updates (Fixing Visibility)
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Admin view all quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users insert own quotations" ON public.quotations;

-- Users View: Own AND NULLs (to recover legacy data)
CREATE POLICY "Users view own quotations"
ON public.quotations
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR created_by IS NULL -- Emergency relief for old data
);

-- Admin View: Uses strict is_admin(auth.uid())
CREATE POLICY "Admin view all quotations"
ON public.quotations
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
);

-- Users Insert: Must set created_by
CREATE POLICY "Users insert own quotations"
ON public.quotations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

-- Users Update: Must own the record
CREATE POLICY "Users update own quotations"
ON public.quotations
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR created_by IS NULL
)
WITH CHECK (
  created_by = auth.uid() OR created_by IS NULL
);

-- 3. Profiles Policy Updates (Fixing Admin Access)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Users view self" ON public.profiles;

CREATE POLICY "Admin full access"
ON public.profiles
FOR ALL
TO authenticated
USING (
  is_admin(auth.uid())
);

CREATE POLICY "Users view self"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

NOTIFY pgrst, 'reload schema';
