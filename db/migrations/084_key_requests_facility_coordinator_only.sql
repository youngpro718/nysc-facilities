-- 084: route key requests exclusively to the Facility Coordinator.
--
-- The supervisor chain (migration 083) is removed from key_requests RLS per
-- product decision: key requests go to facilities_manager (the Facility
-- Coordinator role) only. Admin remains a safety net. The supervisor_id
-- column itself stays for other future uses.
--
-- Applied to live DB.

BEGIN;

DROP POLICY IF EXISTS key_requests_read ON public.key_requests;
CREATE POLICY key_requests_read ON public.key_requests
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR has_role('admin'::user_role)
    OR has_role('facilities_manager'::user_role)
  );

DROP POLICY IF EXISTS key_requests_staff_update ON public.key_requests;
CREATE POLICY key_requests_staff_update ON public.key_requests
  FOR UPDATE
  USING (
    has_role('admin'::user_role)
    OR has_role('facilities_manager'::user_role)
  )
  WITH CHECK (
    has_role('admin'::user_role)
    OR has_role('facilities_manager'::user_role)
  );

COMMIT;
