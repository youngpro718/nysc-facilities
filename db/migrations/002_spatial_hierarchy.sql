-- Migration: 002_spatial_hierarchy.sql
-- Description: Buildings, floors, and rooms tables
-- Author: Architecture Team
-- Date: 2025-10-25
-- Epic: EPIC-001
-- Story: STORY-001

-- ============================================
-- MIGRATION UP
-- ============================================

BEGIN;

-- ============================================
-- BUILDINGS TABLE
-- ============================================

CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT DEFAULT 'New York',
  state TEXT DEFAULT 'NY',
  zip_code TEXT,
  total_floors INTEGER CHECK (total_floors > 0),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_buildings_name ON buildings(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_buildings_active ON buildings(is_active) WHERE is_active = true;

-- Trigger
CREATE TRIGGER trg_buildings_updated_at
  BEFORE UPDATE ON buildings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FLOORS TABLE
-- ============================================

CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
  floor_number INTEGER NOT NULL,
  name TEXT,
  total_rooms INTEGER DEFAULT 0,
  is_accessible BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_floors_building_number UNIQUE (building_id, floor_number),
  CONSTRAINT chk_floors_number_valid CHECK (floor_number BETWEEN -5 AND 100)
);

-- Indexes
CREATE INDEX idx_floors_building ON floors(building_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_floors_number ON floors(floor_number);

-- Trigger
CREATE TRIGGER trg_floors_updated_at
  BEFORE UPDATE ON floors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROOMS TABLE
-- ============================================

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE RESTRICT,
  room_number TEXT NOT NULL,
  room_name TEXT,
  room_type room_type_enum NOT NULL DEFAULT 'office',
  room_subtype TEXT,
  department TEXT,
  capacity INTEGER CHECK (capacity > 0 AND capacity <= 1000),
  square_footage DECIMAL(10,2) CHECK (square_footage > 0),
  status room_status_enum NOT NULL DEFAULT 'available',
  operational_status operational_status_enum NOT NULL DEFAULT 'operational',
  is_accessible BOOLEAN DEFAULT true,
  is_reservable BOOLEAN DEFAULT false,
  has_av_equipment BOOLEAN DEFAULT false,
  has_video_conference BOOLEAN DEFAULT false,
  has_whiteboard BOOLEAN DEFAULT false,
  amenities JSONB DEFAULT '[]'::jsonb,
  wing TEXT,
  section TEXT,
  location_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_rooms_building_floor_number UNIQUE (building_id, floor_id, room_number),
  CONSTRAINT chk_rooms_capacity_positive CHECK (capacity IS NULL OR capacity > 0)
);

-- Indexes
CREATE INDEX idx_rooms_building ON rooms(building_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_floor ON rooms(floor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_room_number ON rooms(room_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_type ON rooms(room_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_status ON rooms(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_department ON rooms(department) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_created_at ON rooms(created_at DESC);

-- Full-text search index
CREATE INDEX idx_rooms_search ON rooms USING gin(
  to_tsvector('english', 
    coalesce(room_number, '') || ' ' || 
    coalesce(room_name, '') || ' ' || 
    coalesce(department, '')
  )
) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
    RAISE EXCEPTION 'Migration failed: buildings table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'floors') THEN
    RAISE EXCEPTION 'Migration failed: floors table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms') THEN
    RAISE EXCEPTION 'Migration failed: rooms table not created';
  END IF;
  
  RAISE NOTICE 'Migration 002_spatial_hierarchy completed successfully';
END $$;

-- ============================================
-- NOTES
-- ============================================
-- Dependencies: 001_core_schema.sql
-- Breaking Changes: No
-- Data Migration: No
-- Estimated Duration: < 2 seconds
