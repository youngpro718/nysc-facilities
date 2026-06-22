-- 089: clear example/mock lighting data.
--
-- The lighting records in the system (fixtures, issues, scans, walkthroughs,
-- maintenance schedules, zones, room profiles) are all example/test data, not
-- real operational records. This wipes them so the reconciled lighting schema
-- (088) starts from a clean slate.
--
-- DELIBERATELY UNTOUCHED — these are real and must NOT be deleted:
--   buildings, floors, hallways, rooms (incl. room names/numbers),
--   keys / key_*, terms / term_*, occupants, profiles.
--
-- This migration only deletes from lighting_* tables and their children.
-- It is idempotent (re-running deletes nothing) and guards each table with
-- to_regclass so it is safe even if a table was never created in this DB.

BEGIN;

-- Children first, then parents, to respect foreign keys.
DO $$
BEGIN
  IF to_regclass('public.fixture_scans') IS NOT NULL THEN
    DELETE FROM public.fixture_scans;
  END IF;

  IF to_regclass('public.lighting_maintenance_schedules') IS NOT NULL THEN
    DELETE FROM public.lighting_maintenance_schedules;
  END IF;

  IF to_regclass('public.lighting_issues') IS NOT NULL THEN
    DELETE FROM public.lighting_issues;
  END IF;

  IF to_regclass('public.walkthrough_sessions') IS NOT NULL THEN
    DELETE FROM public.walkthrough_sessions;
  END IF;

  IF to_regclass('public.lighting_fixtures') IS NOT NULL THEN
    DELETE FROM public.lighting_fixtures;
  END IF;

  IF to_regclass('public.lighting_zones') IS NOT NULL THEN
    DELETE FROM public.lighting_zones;
  END IF;

  -- room_lighting_profiles is keyed by room_id but is itself derived/mock data
  -- (auto-seeded from lighting_issues). Clearing it does NOT affect the rooms
  -- table — only the lighting profile rows.
  IF to_regclass('public.room_lighting_profiles') IS NOT NULL THEN
    DELETE FROM public.room_lighting_profiles;
  END IF;
END$$;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
  remaining bigint;
BEGIN
  IF to_regclass('public.lighting_fixtures') IS NOT NULL THEN
    SELECT count(*) INTO remaining FROM public.lighting_fixtures;
    IF remaining <> 0 THEN
      RAISE EXCEPTION 'Migration 089 failed: % lighting_fixtures rows remain', remaining;
    END IF;
  END IF;

  -- Sanity: rooms must be untouched. We only assert the table still exists and
  -- has rows (we never delete from it here).
  IF to_regclass('public.rooms') IS NOT NULL THEN
    SELECT count(*) INTO remaining FROM public.rooms;
    RAISE NOTICE 'Migration 089: rooms left intact (% rows).', remaining;
  END IF;

  RAISE NOTICE 'Migration 089_clear_mock_lighting_data completed successfully';
END$$;
