-- 088: reconcile lighting schema with what the application actually uses.
--
-- The lighting feature drifted from the migration history: the live DB was
-- hand-edited (085/086/087 were "applied to live DB") while several changes the
-- app depends on were never captured as migrations. On a fresh database those
-- gaps break the feature outright. This migration is idempotent and brings the
-- migration history back in line with the running app so the schema is
-- reproducible from scratch.
--
-- Covers:
--   1. lighting_issues.issue_type — app inserts 'out'/'dim'/'buzzing'/'damaged'
--      which were never in lighting_issue_type_enum. Convert to text + CHECK
--      (matching the bulb_type/ceiling_access pattern from 086), allowing both
--      the current UI values and the legacy enum values so old rows survive.
--   2. lighting_issues.fixture_id — user reports are filed without a fixture,
--      but the column was NOT NULL. Make it nullable.
--   3. fixture_scans.action_taken — walkthrough sends 'functional'/'bulb_out'/
--      'flickering'/'power_issue' which were never in fixture_scan_action_enum.
--      Convert to text + CHECK (current + legacy values).
--   4. room_lighting_profile_summary — a view the app reads on the Rooms /
--      Coverage tabs that was never defined in any migration. (Re)create it.
--   5. lighting_fixtures.last_scanned_at — referenced by increment_scan_count()
--      (migration 031) but never added to the table. Add it.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. lighting_issues.issue_type -> text + CHECK
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lighting_issues'
      AND column_name = 'issue_type'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.lighting_issues
      ALTER COLUMN issue_type TYPE text USING issue_type::text;
  END IF;
END$$;

ALTER TABLE public.lighting_issues
  DROP CONSTRAINT IF EXISTS lighting_issues_issue_type_check;

ALTER TABLE public.lighting_issues
  ADD CONSTRAINT lighting_issues_issue_type_check
  CHECK (issue_type IN (
    -- current UI values (LightingIssueForm)
    'out', 'flickering', 'dim', 'buzzing', 'damaged', 'other',
    -- legacy enum values (pre-085 rows / walkthrough-generated)
    'blown_bulb', 'ballast_issue', 'dim_light', 'power_issue'
  ));

-- ---------------------------------------------------------------------------
-- 2. lighting_issues.fixture_id -> nullable (user reports have no fixture)
-- ---------------------------------------------------------------------------
ALTER TABLE public.lighting_issues
  ALTER COLUMN fixture_id DROP NOT NULL;

COMMENT ON COLUMN public.lighting_issues.fixture_id IS
  'Optional fixture the report is filed against. Null for whole-room or ad-hoc location reports.';

-- ---------------------------------------------------------------------------
-- 3. fixture_scans.action_taken -> text + CHECK
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fixture_scans'
      AND column_name = 'action_taken'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.fixture_scans
      ALTER COLUMN action_taken TYPE text USING action_taken::text;
  END IF;
END$$;

ALTER TABLE public.fixture_scans
  DROP CONSTRAINT IF EXISTS fixture_scans_action_taken_check;

ALTER TABLE public.fixture_scans
  ADD CONSTRAINT fixture_scans_action_taken_check
  CHECK (action_taken IS NULL OR action_taken IN (
    -- current values (WalkthroughFlow / lightingService.recordFixtureScan)
    'functional', 'bulb_out', 'ballast_issue', 'flickering', 'power_issue', 'skip',
    -- legacy enum values
    'mark_out', 'maintenance_needed', 'mark_functional'
  ));

-- ---------------------------------------------------------------------------
-- 4. lighting_fixtures.last_scanned_at — used by increment_scan_count() (031)
-- ---------------------------------------------------------------------------
ALTER TABLE public.lighting_fixtures
  ADD COLUMN IF NOT EXISTS last_scanned_at timestamptz;

-- ---------------------------------------------------------------------------
-- 5. room_lighting_profile_summary view (per-room fixture rollup)
--    Read by roomLightingProfileService.listRoomsWithLightingProfiles().
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.room_lighting_profile_summary;

CREATE VIEW public.room_lighting_profile_summary AS
SELECT
  f.space_id AS room_id,
  COUNT(*)                                                    AS fixture_count,
  COUNT(*) FILTER (WHERE f.status = 'functional')             AS functional_count,
  COUNT(*) FILTER (WHERE f.status = 'non_functional')         AS out_count,
  COUNT(*) FILTER (WHERE f.status = 'maintenance_needed')     AS maintenance_count
FROM public.lighting_fixtures f
WHERE f.space_type = 'room'
  AND f.space_id IS NOT NULL
GROUP BY f.space_id;

COMMENT ON VIEW public.room_lighting_profile_summary IS
  'Per-room fixture counts (total / functional / out / maintenance) from lighting_fixtures. Used by the lighting Rooms & Coverage views.';

GRANT SELECT ON public.room_lighting_profile_summary TO authenticated;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'room_lighting_profile_summary'
  ) THEN
    RAISE EXCEPTION 'Migration 088 failed: room_lighting_profile_summary view not created';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lighting_issues'
      AND column_name = 'fixture_id' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'Migration 088 failed: lighting_issues.fixture_id is still NOT NULL';
  END IF;

  RAISE NOTICE 'Migration 088_lighting_schema_reconciliation completed successfully';
END$$;
