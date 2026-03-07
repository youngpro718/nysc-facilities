-- db/migrations/027_indexes_and_view.sql
-- Performance: indexes on user_roles, fix generate_issue_number race condition,
-- and a convenience view for fixtures with their location.

-- ─── Indexes on user_roles ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- ─── Fix generate_issue_number() race condition ───────────────────────────────
-- Replace MAX()+1 approach with a proper sequence.

CREATE SEQUENCE IF NOT EXISTS public.issue_number_seq
  START WITH 1
  INCREMENT BY 1
  NO CYCLE;

-- Advance sequence to current max so existing numbers are not reused
DO $$
DECLARE
  v_max bigint;
BEGIN
  SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(issue_number, '[^0-9]', '', 'g') AS bigint)), 0)
  INTO v_max
  FROM public.issues
  WHERE issue_number ~ '^[0-9]+$';

  IF v_max > 0 THEN
    PERFORM setval('public.issue_number_seq', v_max);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_issue_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT LPAD(nextval('public.issue_number_seq')::text, 6, '0');
$$;

-- ─── View: fixtures with location ────────────────────────────────────────────
-- Joins lighting_fixtures → spatial_assignments → rooms / unified_spaces.
-- Only picks the first spatial assignment per fixture for a flat view.

CREATE OR REPLACE VIEW public.v_fixtures_with_location AS
SELECT
  f.id,
  f.status,
  f.technology,
  f.bulb_count,
  f.requires_electrician,
  f.electrical_issues,
  f.ballast_issue,
  f.reported_out_date,
  f.replaced_date,
  f.notes,
  f.created_at,
  f.updated_at,
  sa.space_id,
  sa.space_type,
  sa.position,
  sa.sequence_number,
  CASE
    WHEN sa.space_type = 'room' THEN r.name
    ELSE us.name
  END AS space_name,
  CASE
    WHEN sa.space_type = 'room' THEN r.room_number
    ELSE us.room_number
  END AS room_number,
  us.building_name,
  us.floor_name,
  lz.name AS zone_name
FROM public.lighting_fixtures f
LEFT JOIN LATERAL (
  SELECT *
  FROM public.spatial_assignments
  WHERE fixture_id = f.id
  ORDER BY sequence_number NULLS FIRST
  LIMIT 1
) sa ON true
LEFT JOIN public.rooms r ON sa.space_type = 'room' AND r.id = sa.space_id
LEFT JOIN public.unified_spaces us ON sa.space_type <> 'room' AND us.id = sa.space_id
LEFT JOIN public.lighting_zones lz ON lz.id = f.zone_id;

COMMENT ON VIEW public.v_fixtures_with_location IS
  'Denormalized fixture list with first spatial assignment resolved to room/space details.';
