-- Allow system_admin to approve/reject users, matching app-level admin routing

-- ---------------------------------------------------------------------------
-- 1. Approve user verification: allow admin and system_admin callers
-- ---------------------------------------------------------------------------

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
DECLARE
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'admin'
     AND v_caller_role IS DISTINCT FROM 'system_admin' THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  UPDATE public.profiles
  SET
    verification_status = 'verified',
    is_approved = true,
    access_level = CASE
      WHEN p_role IN ('admin', 'system_admin', 'facilities_manager') THEN 'admin'
      WHEN p_role IN ('cmc', 'court_aide', 'purchasing_staff') THEN 'write'
      ELSE 'read'
    END,
    onboarded = true,
    updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

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

REVOKE EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) TO service_role;

COMMENT ON FUNCTION public.approve_user_verification(uuid, text, text) IS 'Admin-only: approve a pending user and assign role. Allows admin and system_admin callers.';

-- Provide a 1-argument compatibility wrapper used by older callers
CREATE OR REPLACE FUNCTION public.approve_user_verification(p_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.approve_user_verification(p_user_id, 'standard', NULL);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_user_verification(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid) TO service_role;

COMMENT ON FUNCTION public.approve_user_verification(uuid) IS 'Compatibility wrapper for approving a user with the standard role.';

-- ---------------------------------------------------------------------------
-- 2. Reject user verification: allow admin and system_admin callers
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.reject_user_verification(uuid, text);
CREATE OR REPLACE FUNCTION public.reject_user_verification(
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'admin'
     AND v_caller_role IS DISTINCT FROM 'system_admin' THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  UPDATE public.profiles
  SET
    verification_status = 'rejected',
    is_approved = false,
    onboarded = false,
    updated_at = NOW()
  WHERE id = p_user_id;

  DELETE FROM public.user_roles
  WHERE user_id = p_user_id
    AND role <> 'admin';

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

REVOKE EXECUTE ON FUNCTION public.reject_user_verification(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user_verification(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user_verification(uuid, text) TO service_role;

COMMENT ON FUNCTION public.reject_user_verification(uuid, text) IS 'Admin-only: reject a pending user. Allows admin and system_admin callers.';
