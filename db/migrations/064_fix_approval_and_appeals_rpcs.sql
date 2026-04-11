-- Fix approval and verification appeal RPCs for the live schema
-- - add missing set_user_approval_status
-- - correct access_level enum assignments
-- - use audit_logs with performed_by / notes
-- - add appeal submit/approve/reject RPCs

-- ---------------------------------------------------------------------------
-- 1. Shared helper: set user approval status atomically
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_user_approval_status(
  p_user_id uuid,
  p_status verification_status_enum
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    verification_status = p_status,
    is_approved = CASE
      WHEN p_status = 'verified' THEN true
      ELSE false
    END,
    updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_user_approval_status(uuid, verification_status_enum) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_approval_status(uuid, verification_status_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_approval_status(uuid, verification_status_enum) TO service_role;

COMMENT ON FUNCTION public.set_user_approval_status(uuid, verification_status_enum) IS
  'Atomically sets verification_status and is_approved for a user. Admin-only.';

-- ---------------------------------------------------------------------------
-- 2. Approve user verification
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_user_verification(
  p_user_id uuid,
  p_role text DEFAULT 'standard',
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
      WHEN p_role IN ('admin', 'system_admin', 'facilities_manager') THEN 'admin'::access_level_enum
      WHEN p_role IN ('cmc', 'court_aide', 'purchasing', 'court_officer') THEN 'write'::access_level_enum
      ELSE 'read'::access_level_enum
    END,
    onboarded = true,
    updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    performed_by,
    notes
  ) VALUES (
    'profiles',
    p_user_id::text,
    'approve_user',
    NULL,
    jsonb_build_object(
      'role', p_role,
      'admin_notes', p_admin_notes,
      'approved_at', NOW()
    ),
    auth.uid(),
    p_admin_notes
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid, text, text) TO service_role;

COMMENT ON FUNCTION public.approve_user_verification(uuid, text, text) IS
  'Admin-only: approve a pending user and assign role.';

-- Compatibility overload used by older call sites
CREATE OR REPLACE FUNCTION public.approve_user_verification(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.approve_user_verification(p_user_id, 'standard', NULL);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_user_verification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_verification(uuid) TO service_role;

COMMENT ON FUNCTION public.approve_user_verification(uuid) IS
  'Compatibility wrapper for approving a user with the standard role.';

-- ---------------------------------------------------------------------------
-- 3. Reject user verification
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_user_verification(
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    access_level = 'none'::access_level_enum,
    onboarded = false,
    updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = p_user_id;

  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    performed_by,
    notes
  ) VALUES (
    'profiles',
    p_user_id::text,
    'reject_user',
    NULL,
    jsonb_build_object(
      'reason', p_reason,
      'rejected_at', NOW()
    ),
    auth.uid(),
    p_reason
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_user_verification(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_user_verification(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user_verification(uuid, text) TO service_role;

COMMENT ON FUNCTION public.reject_user_verification(uuid, text) IS
  'Admin-only: reject a pending user.';

-- ---------------------------------------------------------------------------
-- 4. Verification appeals workflow
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_verification_appeal(
  p_appeal_reason text,
  p_additional_info text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_verification_status text;
  v_appeal_id uuid;
  v_existing_pending int;
BEGIN
  v_user_id := auth.uid();

  SELECT verification_status INTO v_verification_status
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_verification_status IS DISTINCT FROM 'rejected' THEN
    RAISE EXCEPTION 'Only rejected users can submit appeals';
  END IF;

  SELECT COUNT(*) INTO v_existing_pending
  FROM public.verification_appeals
  WHERE user_id = v_user_id
    AND status = 'pending';

  IF v_existing_pending > 0 THEN
    RAISE EXCEPTION 'You already have a pending appeal. Please wait for admin review.';
  END IF;

  INSERT INTO public.verification_appeals (
    user_id,
    appeal_reason,
    additional_info,
    status
  ) VALUES (
    v_user_id,
    p_appeal_reason,
    p_additional_info,
    'pending'
  )
  RETURNING id INTO v_appeal_id;

  RETURN v_appeal_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_verification_appeal(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_verification_appeal(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_verification_appeal(text, text) TO service_role;

COMMENT ON FUNCTION public.submit_verification_appeal(text, text) IS
  'Allows rejected users to submit an appeal for re-review. Returns appeal ID.';

CREATE OR REPLACE FUNCTION public.approve_verification_appeal(
  p_appeal_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_appeal_status text;
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'admin'
     AND v_caller_role IS DISTINCT FROM 'system_admin' THEN
    RAISE EXCEPTION 'Only admins can approve appeals';
  END IF;

  SELECT user_id, status INTO v_user_id, v_appeal_status
  FROM public.verification_appeals
  WHERE id = p_appeal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appeal not found';
  END IF;

  IF v_appeal_status != 'pending' THEN
    RAISE EXCEPTION 'Appeal has already been reviewed';
  END IF;

  UPDATE public.verification_appeals
  SET
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    admin_notes = p_admin_notes
  WHERE id = p_appeal_id;

  PERFORM public.set_user_approval_status(v_user_id, 'pending');

  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    performed_by,
    notes
  ) VALUES (
    'verification_appeals',
    p_appeal_id::text,
    'approve_appeal',
    NULL,
    jsonb_build_object(
      'appeal_id', p_appeal_id,
      'admin_notes', p_admin_notes,
      'timestamp', NOW()
    ),
    auth.uid(),
    p_admin_notes
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_verification_appeal(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_verification_appeal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_verification_appeal(uuid, text) TO service_role;

COMMENT ON FUNCTION public.approve_verification_appeal(uuid, text) IS
  'Approves a verification appeal and resets the user to pending status for re-review.';

CREATE OR REPLACE FUNCTION public.reject_verification_appeal(
  p_appeal_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_appeal_status text;
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'admin'
     AND v_caller_role IS DISTINCT FROM 'system_admin' THEN
    RAISE EXCEPTION 'Only admins can reject appeals';
  END IF;

  SELECT user_id, status INTO v_user_id, v_appeal_status
  FROM public.verification_appeals
  WHERE id = p_appeal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appeal not found';
  END IF;

  IF v_appeal_status != 'pending' THEN
    RAISE EXCEPTION 'Appeal has already been reviewed';
  END IF;

  UPDATE public.verification_appeals
  SET
    status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    admin_notes = p_admin_notes
  WHERE id = p_appeal_id;

  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    performed_by,
    notes
  ) VALUES (
    'verification_appeals',
    p_appeal_id::text,
    'reject_appeal',
    NULL,
    jsonb_build_object(
      'appeal_id', p_appeal_id,
      'admin_notes', p_admin_notes,
      'timestamp', NOW()
    ),
    auth.uid(),
    p_admin_notes
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_verification_appeal(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_verification_appeal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_verification_appeal(uuid, text) TO service_role;

COMMENT ON FUNCTION public.reject_verification_appeal(uuid, text) IS
  'Rejects a verification appeal.';
