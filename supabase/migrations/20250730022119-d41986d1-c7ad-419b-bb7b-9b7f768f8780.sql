-- Fix infinite recursion in user_roles RLS policies
-- First, let's check current policies and then fix them

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admin can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own user roles" ON user_roles;

-- Create simple, non-recursive policies
CREATE POLICY "Allow users to view their own role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow service role to manage all roles"
ON user_roles FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Also fix the profiles table policies to prevent recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Allow users to view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Allow service role to manage all profiles"
ON profiles FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');