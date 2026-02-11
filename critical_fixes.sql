-- STRICT FIX REQUEST - CRITICAL ISSUES
-- ISSUE 2: SALES PANEL - USERS CAN SEE ALL QUOTATIONS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own quotations" ON public.quotations;

CREATE POLICY "Users view own quotations"
ON public.quotations
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
);

-- Note: The prompt used 'user_id', but the schema uses 'created_by'. 
-- I have strictly followed the logic "quotations.user_id = auth.uid()" mapping 'user_id' to existing 'created_by' column.

-- ISSUE 4: ADMIN PANEL - CANNOT VIEW OR ADD USERS
-- Adapting 'users' to 'profiles' as 'profiles' is the table used by the application.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read users" ON public.profiles;
DROP POLICY IF EXISTS "Admin insert users" ON public.profiles;

CREATE POLICY "Admin read users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admin insert users"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
