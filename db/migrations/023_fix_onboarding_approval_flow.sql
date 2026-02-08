-- db/migrations/023_fix_onboarding_approval_flow.sql
-- Fix: approve_user_verification should NOT set onboarding_completed=true
-- The onboarding wizard should set that flag when the user completes it.
-- This allows the wizard to actually show after admin approval.

-- Add onboarding_skipped column if it doesn't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_skipped boolean DEFAULT false;

-- Update approve_user_verification to NOT mark onboarding as completed
-- The user will complete onboarding via the wizard after first login
DROP FUNCTION IF EXISTS public.approve_user_verification(uuid, text, text);
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
  -- NOTE: onboarding_completed is intentionally NOT set here.
  -- The user will complete the onboarding wizard on first login.
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.approve_user_verification(uuid, text, text) IS 'Admin function to approve a pending user and assign role. Does NOT mark onboarding as completed — the user completes that via the wizard.';
