-- =============================================================================
-- Migration 035: admin_update_user_role RPC
--
-- AdminCenter.tsx line 312 calls supabase.rpc('admin_update_user_role', {
--   target_user_id, new_role }) but this function never existed in any
-- migration.  Every role change in the verified-users tab was silently
-- failing with a "function does not exist" PostgREST error.
--
-- This function:
--   1. Verifies the caller is an admin (SECURITY DEFINER + runtime check)
--   2. Upserts user_roles (the authoritative role store)
--   3. Writes an audit_log entry
--   4. Returns { success: bool, message: text } matching AdminCenter's
--      runtime check at line 319-321
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id  uuid,
  new_role        text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_valid_roles text[] := ARRAY['admin', 'cmc', 'court_aide', 'standard'];
BEGIN
  -- Runtime admin check (defence-in-depth alongside GRANT)
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Permission denied: admin role required');
  END IF;

  -- Validate role value
  IF new_role IS NULL OR NOT (new_role = ANY(v_valid_roles)) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid role: ' || COALESCE(new_role, 'null'));
  END IF;

  -- Prevent an admin from accidentally downgrading their own account
  IF target_user_id = auth.uid() AND new_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot change your own admin role');
  END IF;

  -- Upsert into user_roles (the single source of truth for roles)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id) DO UPDATE
    SET role       = EXCLUDED.role,
        updated_at = NOW();

  -- Audit trail
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (
    auth.uid(),
    'change_role',
    'user_roles',
    target_user_id,
    jsonb_build_object('new_role', new_role, 'changed_at', NOW())
  );

  RETURN jsonb_build_object('success', true, 'message', 'Role updated to ' || new_role);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text) TO authenticated;
