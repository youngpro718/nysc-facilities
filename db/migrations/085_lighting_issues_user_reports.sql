-- 085: user-facing lighting issue reports.
--
-- Adds reporter + location columns so issues filed outside a fixture context
-- (e.g. "light out in Room 1123") can be tracked back to the user. Broadens
-- writes from admin-only to admin + facilities_manager (the Facility
-- Coordinator who actually resolves lighting issues). Replaces the four
-- overlapping policies with three clear ones.
--
-- Also re-targets the reported_by FK at public.profiles instead of auth.users
-- so PostgREST can auto-embed reporter info in staff queries (085b inline).
--
-- Applied to live DB.

BEGIN;

ALTER TABLE public.lighting_issues
  ADD COLUMN IF NOT EXISTS reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_description text;

CREATE INDEX IF NOT EXISTS idx_lighting_issues_reported_by ON public.lighting_issues(reported_by);
CREATE INDEX IF NOT EXISTS idx_lighting_issues_status ON public.lighting_issues(status);

COMMENT ON COLUMN public.lighting_issues.reported_by IS
  'The user who filed this issue. Null for legacy / walkthrough-generated rows.';
COMMENT ON COLUMN public.lighting_issues.room_id IS
  'Room the issue is in, when known. Either room_id or location_description should be set for user-filed reports.';

-- Reset overlapping policies.
DROP POLICY IF EXISTS "Admins can manage lighting issues" ON public.lighting_issues;
DROP POLICY IF EXISTS "Authenticated users can create lighting issues" ON public.lighting_issues;
DROP POLICY IF EXISTS "Users can view lighting issues" ON public.lighting_issues;
DROP POLICY IF EXISTS admins_modify ON public.lighting_issues;
DROP POLICY IF EXISTS authenticated_read ON public.lighting_issues;
DROP POLICY IF EXISTS lighting_issues_read ON public.lighting_issues;
DROP POLICY IF EXISTS lighting_issues_write ON public.lighting_issues;

CREATE POLICY lighting_issues_read ON public.lighting_issues
  FOR SELECT
  USING (
    reported_by = auth.uid()
    OR has_role('admin'::user_role)
    OR has_role('facilities_manager'::user_role)
  );

CREATE POLICY lighting_issues_user_insert ON public.lighting_issues
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (reported_by IS NULL OR reported_by = auth.uid())
  );

CREATE POLICY lighting_issues_staff_update ON public.lighting_issues
  FOR UPDATE
  USING (
    has_role('admin'::user_role)
    OR has_role('facilities_manager'::user_role)
  )
  WITH CHECK (
    has_role('admin'::user_role)
    OR has_role('facilities_manager'::user_role)
  );

CREATE POLICY lighting_issues_admin_delete ON public.lighting_issues
  FOR DELETE
  USING (has_role('admin'::user_role));

COMMIT;
