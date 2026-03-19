-- =============================================================================
-- Migration 037: Add purchasing role
--
-- Adds 'purchasing' as a valid role for users who manage inventory and
-- supply procurement. Also updates:
--   1. admin_update_user_role() valid roles array
--   2. approve_user_verification() valid roles array (if present)
--   3. Bruce Stern's role from cmc → purchasing
-- =============================================================================

-- 1) Update admin_update_user_role to accept 'purchasing'
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
  v_valid_roles text[] := ARRAY['admin', 'cmc', 'court_officer', 'purchasing', 'court_aide', 'standard'];
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

-- 2) Update Bruce Stern from cmc → purchasing
UPDATE public.user_roles
SET role = 'purchasing', updated_at = NOW()
WHERE user_id = '860d400b-9bc9-4435-89be-deb257ecfb3f';
