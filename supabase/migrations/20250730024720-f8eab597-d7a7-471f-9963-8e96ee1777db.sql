-- Fix remaining functions without search_path
CREATE OR REPLACE FUNCTION public.add_admin_user(email_to_promote text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Verify that the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can promote users to admin';
  END IF;
  
  -- Validate email format
  IF email_to_promote IS NULL OR email_to_promote = '' THEN
    RAISE EXCEPTION 'Email address is required';
  END IF;
  
  IF email_to_promote !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address format';
  END IF;
  
  -- Find the user by email in profiles table
  SELECT id INTO target_user_id 
  FROM public.profiles 
  WHERE email = lower(trim(email_to_promote))
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email_to_promote;
  END IF;
  
  -- Prevent self-promotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot promote yourself to admin';
  END IF;
  
  -- Check if user is already an admin
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'User % is already an administrator', email_to_promote;
  END IF;
  
  -- Add or update the user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin', updated_at = now();
  
  -- Log the admin promotion for audit purposes
  INSERT INTO public.role_audit_log (
    user_id, target_user_id, action, new_role, reason
  ) VALUES (
    auth.uid(), target_user_id, 'role_assigned', 'admin', 
    'User promoted to admin via add_admin_user function'
  );
END;
$$;