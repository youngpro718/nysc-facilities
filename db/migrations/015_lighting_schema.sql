-- Migration: 015_lighting_schema.sql
-- Description: Lighting fixtures, zones, issues, maintenance, and walkthrough schema
-- Author: Cascade (assistant)
-- Date: 2025-11-15
-- Epic: EPIC-001
-- Notes:
--   This migration captures the lighting-related tables inferred from the
--   application code. It is designed to be additive only and should not
--   alter or drop any existing core tables.

-- ============================================
-- MIGRATION UP
-- ============================================

BEGIN;

-- ============================================
-- ENUMS
-- ============================================

-- Lighting fixture types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lighting_type_enum') THEN
    CREATE TYPE lighting_type_enum AS ENUM (
      'standard',
      'emergency',
      'exit_sign',
      'decorative',
      'motion_sensor'
    );
  END IF;
END$$;

-- Lighting fixture operational status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'light_status_enum') THEN
    CREATE TYPE light_status_enum AS ENUM (
      'functional',
      'non_functional',
      'maintenance_needed',
      'scheduled_replacement',
      'pending_maintenance'
    );
  END IF;
END$$;

-- Lighting installation position
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lighting_position_enum') THEN
    CREATE TYPE lighting_position_enum AS ENUM (
      'ceiling',
      'wall',
      'floor',
      'desk'
    );
  END IF;
END$$;

-- Lighting technology
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lighting_technology_enum') THEN
    CREATE TYPE lighting_technology_enum AS ENUM (
      'LED',
      'Fluorescent',
      'Bulb'
    );
  END IF;
END$$;

-- Lighting zones type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lighting_zone_type_enum') THEN
    CREATE TYPE lighting_zone_type_enum AS ENUM (
      'general',
      'emergency',
      'restricted'
    );
  END IF;
END$$;

-- Lighting issues
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lighting_issue_type_enum') THEN
    CREATE TYPE lighting_issue_type_enum AS ENUM (
      'blown_bulb',
      'ballast_issue',
      'flickering',
      'dim_light',
      'power_issue',
      'other'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lighting_issue_status_enum') THEN
    CREATE TYPE lighting_issue_status_enum AS ENUM (
      'open',
      'in_progress',
      'resolved',
      'deferred'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lighting_issue_priority_enum') THEN
    CREATE TYPE lighting_issue_priority_enum AS ENUM (
      'low',
      'medium',
      'high',
      'critical'
    );
  END IF;
END$$;

-- Maintenance schedule status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lighting_maintenance_status_enum') THEN
    CREATE TYPE lighting_maintenance_status_enum AS ENUM (
      'scheduled',
      'in_progress',
      'completed',
      'overdue'
    );
  END IF;
END$$;

-- Walkthrough session status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'walkthrough_status_enum') THEN
    CREATE TYPE walkthrough_status_enum AS ENUM (
      'in_progress',
      'completed',
      'cancelled'
    );
  END IF;
END$$;

-- Fixture scan actions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fixture_scan_action_enum') THEN
    CREATE TYPE fixture_scan_action_enum AS ENUM (
      'mark_out',
      'ballast_issue',
      'maintenance_needed',
      'mark_functional',
      'skip'
    );
  END IF;
END$$;

-- ============================================
-- LIGHTING ZONES
-- ============================================

CREATE TABLE IF NOT EXISTS lighting_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type lighting_zone_type_enum NOT NULL DEFAULT 'general',
  floor_id UUID REFERENCES floors(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_lighting_zones_updated_at'
  ) THEN
    CREATE TRIGGER trg_lighting_zones_updated_at
      BEFORE UPDATE ON lighting_zones
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- ============================================
-- LIGHTING FIXTURES
-- ============================================

CREATE TABLE IF NOT EXISTS lighting_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type lighting_type_enum NOT NULL DEFAULT 'standard',
  status light_status_enum NOT NULL DEFAULT 'functional',
  technology lighting_technology_enum,
  position lighting_position_enum NOT NULL DEFAULT 'ceiling',
  bulb_count INTEGER NOT NULL DEFAULT 1 CHECK (bulb_count > 0),
  -- Spatial linkage
  space_id UUID,
  space_type TEXT,
  room_number TEXT,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  floor_id UUID REFERENCES floors(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES lighting_zones(id) ON DELETE SET NULL,
  -- Electrical/maintenance
  electrical_issues JSONB,
  ballast_issue BOOLEAN NOT NULL DEFAULT false,
  requires_electrician BOOLEAN NOT NULL DEFAULT false,
  reported_out_date TIMESTAMPTZ,
  replaced_date TIMESTAMPTZ,
  notes TEXT,
  ballast_check_notes TEXT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  installation_date DATE,
  emergency_circuit BOOLEAN DEFAULT false,
  scan_count INTEGER NOT NULL DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_lighting_fixtures_status
  ON lighting_fixtures(status);

CREATE INDEX IF NOT EXISTS idx_lighting_fixtures_space
  ON lighting_fixtures(space_id, space_type);

CREATE INDEX IF NOT EXISTS idx_lighting_fixtures_zone
  ON lighting_fixtures(zone_id);

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_lighting_fixtures_updated_at'
  ) THEN
    CREATE TRIGGER trg_lighting_fixtures_updated_at
      BEFORE UPDATE ON lighting_fixtures
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- ============================================
-- LIGHTING ISSUES
-- ============================================

CREATE TABLE IF NOT EXISTS lighting_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL REFERENCES lighting_fixtures(id) ON DELETE CASCADE,
  issue_type lighting_issue_type_enum NOT NULL,
  priority lighting_issue_priority_enum NOT NULL DEFAULT 'medium',
  status lighting_issue_status_enum NOT NULL DEFAULT 'open',
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lighting_issues_fixture
  ON lighting_issues(fixture_id);

CREATE INDEX IF NOT EXISTS idx_lighting_issues_status
  ON lighting_issues(status);

CREATE INDEX IF NOT EXISTS idx_lighting_issues_priority
  ON lighting_issues(priority);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_lighting_issues_updated_at'
  ) THEN
    CREATE TRIGGER trg_lighting_issues_updated_at
      BEFORE UPDATE ON lighting_issues
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- ============================================
-- LIGHTING MAINTENANCE SCHEDULES
-- ============================================

CREATE TABLE IF NOT EXISTS lighting_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL REFERENCES lighting_fixtures(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  estimated_duration TEXT,
  priority_level priority_enum NOT NULL DEFAULT 'medium',
  notes TEXT,
  assigned_technician UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status lighting_maintenance_status_enum NOT NULL DEFAULT 'scheduled',
  parts_required JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lighting_maintenance_fixture
  ON lighting_maintenance_schedules(fixture_id);

CREATE INDEX IF NOT EXISTS idx_lighting_maintenance_date
  ON lighting_maintenance_schedules(scheduled_date);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_lighting_maintenance_schedules_updated_at'
  ) THEN
    CREATE TRIGGER trg_lighting_maintenance_schedules_updated_at
      BEFORE UPDATE ON lighting_maintenance_schedules
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- ============================================
-- WALKTHROUGH SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS walkthrough_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hallway_id UUID REFERENCES hallways(id) ON DELETE SET NULL,
  floor_id UUID REFERENCES floors(id) ON DELETE SET NULL,
  started_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_fixtures INTEGER NOT NULL DEFAULT 0,
  fixtures_checked INTEGER NOT NULL DEFAULT 0,
  issues_found INTEGER NOT NULL DEFAULT 0,
  ballast_issues_found INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  status walkthrough_status_enum NOT NULL DEFAULT 'in_progress'
);

CREATE INDEX IF NOT EXISTS idx_walkthrough_sessions_hallway
  ON walkthrough_sessions(hallway_id);

CREATE INDEX IF NOT EXISTS idx_walkthrough_sessions_started_at
  ON walkthrough_sessions(started_at DESC);

-- ============================================
-- FIXTURE SCANS
-- ============================================

CREATE TABLE IF NOT EXISTS fixture_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL REFERENCES lighting_fixtures(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_taken fixture_scan_action_enum,
  scan_location TEXT,
  device_info JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_fixture_scans_fixture
  ON fixture_scans(fixture_id);

CREATE INDEX IF NOT EXISTS idx_fixture_scans_scanned_at
  ON fixture_scans(scanned_at DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

 -- Increment times_scanned and update last_scanned_at on lighting_fixtures when a scan is recorded
 CREATE OR REPLACE FUNCTION public.increment_scan_count(fixture_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE lighting_fixtures
  SET 
    times_scanned = COALESCE(times_scanned, 0) + 1,
    last_scanned_at = NOW()
  WHERE id = fixture_id;
END;
$function$;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lighting_fixtures') THEN
    RAISE EXCEPTION 'Migration failed: lighting_fixtures table not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lighting_zones') THEN
    RAISE EXCEPTION 'Migration failed: lighting_zones table not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lighting_issues') THEN
    RAISE EXCEPTION 'Migration failed: lighting_issues table not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lighting_maintenance_schedules') THEN
    RAISE EXCEPTION 'Migration failed: lighting_maintenance_schedules table not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'walkthrough_sessions') THEN
    RAISE EXCEPTION 'Migration failed: walkthrough_sessions table not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fixture_scans') THEN
    RAISE EXCEPTION 'Migration failed: fixture_scans table not created';
  END IF;

  RAISE NOTICE 'Migration 015_lighting_schema completed successfully';
END $$;
