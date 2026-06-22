-- 083: per-user supervisor chain + key-request visibility for supervisors
--
-- Why: key requests need to be approvable by the requester's named supervisor,
-- not any of the broad "key manager" roles. The supervisor sees only their own
-- reports' requests. Admins remain a safety net via has_role('admin').
--
-- Applied to live DB.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS supervisor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_supervisor_id ON public.profiles(supervisor_id);

COMMENT ON COLUMN public.profiles.supervisor_id IS
  'The user this profile reports to. Used to gate key-request approval — only the named supervisor (or an admin) can approve.';

CREATE OR REPLACE FUNCTION public.is_supervisor_of(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND supervisor_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_supervisor_of(uuid) TO authenticated;

DROP POLICY IF EXISTS key_requests_read ON public.key_requests;
CREATE POLICY key_requests_read ON public.key_requests
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_supervisor_of(user_id)
    OR public.is_key_manager()
  );

DROP POLICY IF EXISTS key_requests_staff_update ON public.key_requests;
CREATE POLICY key_requests_staff_update ON public.key_requests
  FOR UPDATE
  USING (
    public.is_supervisor_of(user_id)
    OR public.is_key_manager()
  )
  WITH CHECK (
    public.is_supervisor_of(user_id)
    OR public.is_key_manager()
  );

CREATE OR REPLACE FUNCTION public.admin_set_user_supervisor(p_user_id uuid, p_supervisor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role('admin'::user_role) THEN
    RAISE EXCEPTION 'admin role required';
  END IF;
  IF p_supervisor_id IS NOT NULL AND p_supervisor_id = p_user_id THEN
    RAISE EXCEPTION 'a user cannot be their own supervisor';
  END IF;
  UPDATE public.profiles SET supervisor_id = p_supervisor_id WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_supervisor(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_supervisor(uuid, uuid) TO authenticated;

COMMIT;
