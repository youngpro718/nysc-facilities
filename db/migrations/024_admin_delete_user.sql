-- db/migrations/024_admin_delete_user.sql
-- Create a SECURITY DEFINER function for admin user deletion.
-- This properly cleans up all related records and the auth.users entry.
-- Client-side direct deletes fail due to RLS policies only allowing 'coordinator' role.

-- Drop if exists to allow re-running
DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_caller_role text;
  r RECORD;
BEGIN
  -- Verify the caller is an admin
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;

  -- Prevent self-deletion
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Dynamically delete ALL foreign key references to auth.users for this user.
  -- This prevents FK constraint errors regardless of what tables exist.
  FOR r IN
    SELECT
      kcu.table_schema,
      kcu.table_name,
      kcu.column_name
    FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = rc.constraint_name
      AND kcu.constraint_schema = rc.constraint_schema
    JOIN information_schema.key_column_usage ccu
      ON ccu.constraint_name = rc.unique_constraint_name
      AND ccu.constraint_schema = rc.unique_constraint_schema
    WHERE ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
      AND ccu.column_name = 'id'
  LOOP
    EXECUTE format(
      'DELETE FROM %I.%I WHERE %I = $1',
      r.table_schema, r.table_name, r.column_name
    ) USING p_user_id;
  END LOOP;

  -- Finally delete the auth.users entry
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- Also update the RLS delete policy to allow admin role (not just coordinator)
DROP POLICY IF EXISTS profiles_coordinator_delete ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;

CREATE POLICY profiles_admin_delete
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Grant execute
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

COMMENT ON FUNCTION public.admin_delete_user(uuid) IS 'Admin-only function to fully delete a user and all related records including auth.users entry.';
