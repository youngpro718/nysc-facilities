-- Fix recursive RLS policy on user_roles table

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Create a simple, non-recursive policy for users to see their own role
CREATE POLICY "users_can_read_own_role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Create admin policy using security definer function
CREATE POLICY "admins_can_manage_all_roles" 
ON public.user_roles 
FOR ALL 
USING (is_current_user_admin());

-- Ensure the get_current_user_role function exists and is properly defined
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;