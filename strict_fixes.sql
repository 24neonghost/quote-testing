-- STRICT RLS FIXES FOR RAISE-QUOTE
-- Run this script in the Supabase SQL Editor

-- 1. Admin Users Access
-- Allow admins to view all users
CREATE POLICY "Admin can view all users"
ON users
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Allow admins to insert new users
CREATE POLICY "Admin can insert users"
ON users
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- 2. Quotations Privacy & Isolation
-- Enable RLS on quotations if not already enabled
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Allow users to view ONLY their own quotations
CREATE POLICY "Users can view only their own quotations"
ON quotations
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Allow admins to view ALL quotations
CREATE POLICY "Admin can view all quotations"
ON quotations
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);
