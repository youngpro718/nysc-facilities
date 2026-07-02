-- 092: let court officers toggle the courtroom bunting flag
--
-- Why: bunting (table skirting) is physically set up and removed by court
-- officers, but court_rooms writes are gated to is_privileged() roles
-- (admin, facilities_manager, cmc, court_liaison), so officers could see the
-- flag in the courtroom directory but never update it. Granting officers a
-- blanket UPDATE policy on court_rooms would also let them change capacities,
-- maintenance status, and notes — too broad. This SECURITY DEFINER RPC scopes
-- their write to exactly one column. Sergeants are included because they run
-- the courtroom day-to-day alongside officers.

BEGIN;

CREATE OR REPLACE FUNCTION public.set_courtroom_bunting(p_room_id uuid, p_has_bunting boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role::text IN (
        'admin', 'facilities_manager', 'cmc', 'court_liaison',
        'court_officer', 'sergeant'
      )
  ) THEN
    RAISE EXCEPTION 'Not authorized to update bunting status';
  END IF;

  UPDATE court_rooms
  SET has_bunting = p_has_bunting
  WHERE room_id = p_room_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.set_courtroom_bunting(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_courtroom_bunting(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_courtroom_bunting(uuid, boolean) TO authenticated;

COMMIT;
