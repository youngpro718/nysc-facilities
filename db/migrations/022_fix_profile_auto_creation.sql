-- db/migrations/022_fix_profile_auto_creation.sql
-- Fix profile auto-creation to properly set initial values and copy signup data

-- Drop and recreate the handle_new_user function with proper field mapping
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_department_id uuid;
BEGIN
  -- Extract user data from auth metadata
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', TRIM(v_first_name || ' ' || v_last_name));
  
  -- Try to get department_id if provided
  BEGIN
    v_department_id := (NEW.raw_user_meta_data->>'department_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_department_id := NULL;
  END;

  -- Insert or update profile with all signup data
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    title,
    phone,
    department_id,
    department,
    room_number,
    court_position,
    emergency_contact,
    verification_status,
    is_approved,
    access_level,
    onboarded,
    onboarding_completed,
    mfa_enforced,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_full_name,
    NEW.raw_user_meta_data->>'title',
    NEW.raw_user_meta_data->>'phone',
    v_department_id,
    NEW.raw_user_meta_data->>'department', -- Legacy text field
    NEW.raw_user_meta_data->>'room_number',
    NEW.raw_user_meta_data->>'court_position',
    CASE 
      WHEN NEW.raw_user_meta_data->>'emergency_contact' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'emergency_contact')::jsonb
      ELSE NULL
    END,
    'pending',  -- New users start as pending verification
    false,      -- Not approved until admin approves
    'none',     -- No access until approved
    false,      -- Not onboarded yet
    false,      -- Onboarding not completed
    false,      -- MFA not enforced by default
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    title = COALESCE(EXCLUDED.title, profiles.title),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    department_id = COALESCE(EXCLUDED.department_id, profiles.department_id),
    room_number = COALESCE(EXCLUDED.room_number, profiles.room_number),
    court_position = COALESCE(EXCLUDED.court_position, profiles.court_position),
    updated_at = NOW();
  
  -- Create default user role (standard)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'standard')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Add room_number column if it doesn't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS room_number text;

-- Add court_position column if it doesn't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS court_position text;

-- Add emergency_contact column if it doesn't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS emergency_contact jsonb;

-- Update the approve_user_verification function to be more robust
CREATE OR REPLACE FUNCTION public.approve_user_verification(
  p_user_id uuid,
  p_role text DEFAULT 'standard',
  p_admin_notes text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update profile to approved status
  UPDATE public.profiles
  SET 
    verification_status = 'verified',
    is_approved = true,
    access_level = CASE 
      WHEN p_role IN ('admin', 'facilities_manager') THEN 'admin'
      WHEN p_role IN ('cmc', 'court_aide', 'purchasing_staff') THEN 'write'
      ELSE 'read'
    END,
    onboarded = true,
    onboarding_completed = true,
    onboarding_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Update or insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();
  
  -- Log the approval
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
    'approve_user',
    'profiles',
    p_user_id,
    jsonb_build_object(
      'role', p_role,
      'admin_notes', p_admin_notes,
      'approved_at', NOW()
    )
  );
END;
$$;

-- Create function to reject user
CREATE OR REPLACE FUNCTION public.reject_user_verification(
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update profile to rejected status
  UPDATE public.profiles
  SET 
    verification_status = 'rejected',
    is_approved = false,
    access_level = 'none',
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the rejection
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
    'reject_user',
    'profiles',
    p_user_id,
    jsonb_build_object(
      'reason', p_reason,
      'rejected_at', NOW()
    )
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user_verification(uuid, text) TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Auto-creates profile when user signs up, copying all signup data';
COMMENT ON FUNCTION public.approve_user_verification(uuid, text, text) IS 'Admin function to approve a pending user and assign role';
COMMENT ON FUNCTION public.reject_user_verification(uuid, text) IS 'Admin function to reject a pending user';
