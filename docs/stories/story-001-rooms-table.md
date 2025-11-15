# STORY-001: Rooms Table Stabilization

**Story ID:** STORY-001  
**Epic:** [EPIC-001](../epics/epic-001-schema-stabilization.md) - Schema Stabilization  
**Title:** Stabilize and Document Rooms Table Schema  
**Status:** 📋 To Do  
**Priority:** 🔴 Critical  
**Story Points:** 5  
**Sprint:** Sprint 1, Week 1 (Days 1-2)

---

## 📋 User Story

**As a** facilities manager  
**I want** a stable and well-documented rooms table  
**So that** I can reliably track and manage all rooms in the courthouse

---

## 🎯 Acceptance Criteria

### Must Have
- [ ] Rooms table schema documented with all columns and constraints
- [ ] Foreign keys to buildings and floors properly defined
- [ ] Indexes created for common query patterns
- [ ] RLS policies applied for data security
- [ ] Migration script created and tested
- [ ] Existing data validated and cleaned
- [ ] ERD diagram updated
- [ ] API endpoints tested for compatibility

### Should Have
- [ ] Room capacity validation constraints
- [ ] Room status enum properly defined
- [ ] Audit triggers for change tracking
- [ ] Performance benchmarks established

### Nice to Have
- [ ] Room history table for tracking changes
- [ ] Automated room number validation
- [ ] Room utilization metrics

---

## 🗄️ Current State

### Existing Schema
```sql
-- Current rooms table (simplified view)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  building_id UUID REFERENCES buildings(id),
  floor_id UUID REFERENCES floors(id),
  room_type TEXT,
  capacity INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Current Data
- **Total Rooms:** 94 records
- **Buildings:** 2 buildings
- **Floors:** 15 floors
- **Room Types:** Office, Courtroom, Conference, Storage, etc.

### Issues Identified
1. Missing constraints on room_number uniqueness
2. No validation for capacity (can be negative)
3. Status field is TEXT instead of ENUM
4. Missing indexes on building_id and floor_id
5. No audit trail for room changes
6. Inconsistent room numbering format

---

## 🏗️ Proposed Schema

### Enhanced Rooms Table
```sql
-- Enhanced rooms table with proper constraints
CREATE TABLE IF NOT EXISTS rooms (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Attributes
  room_number TEXT NOT NULL,
  room_name TEXT,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE RESTRICT,
  
  -- Room Classification
  room_type room_type_enum NOT NULL DEFAULT 'office',
  room_subtype TEXT,
  department TEXT,
  
  -- Capacity & Dimensions
  capacity INTEGER CHECK (capacity > 0 AND capacity <= 1000),
  square_footage DECIMAL(10,2) CHECK (square_footage > 0),
  
  -- Status & Availability
  status room_status_enum NOT NULL DEFAULT 'available',
  operational_status operational_status_enum NOT NULL DEFAULT 'operational',
  is_accessible BOOLEAN DEFAULT true,
  is_reservable BOOLEAN DEFAULT false,
  
  -- Features & Amenities
  has_av_equipment BOOLEAN DEFAULT false,
  has_video_conference BOOLEAN DEFAULT false,
  has_whiteboard BOOLEAN DEFAULT false,
  amenities JSONB DEFAULT '[]'::jsonb,
  
  -- Location Details
  wing TEXT,
  section TEXT,
  location_notes TEXT,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT uq_rooms_building_floor_number 
    UNIQUE (building_id, floor_id, room_number),
  CONSTRAINT chk_rooms_capacity_positive 
    CHECK (capacity IS NULL OR capacity > 0),
  CONSTRAINT chk_rooms_square_footage_positive 
    CHECK (square_footage IS NULL OR square_footage > 0)
);

-- Enums
CREATE TYPE room_type_enum AS ENUM (
  'office',
  'courtroom',
  'conference',
  'storage',
  'restroom',
  'lobby',
  'hallway',
  'utility',
  'mechanical',
  'other'
);

CREATE TYPE room_status_enum AS ENUM (
  'available',
  'occupied',
  'reserved',
  'maintenance',
  'closed',
  'under_construction'
);

CREATE TYPE operational_status_enum AS ENUM (
  'operational',
  'non_operational',
  'limited',
  'temporary'
);

-- Indexes
CREATE INDEX idx_rooms_building_id ON rooms(building_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_floor_id ON rooms(floor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_room_number ON rooms(room_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_room_type ON rooms(room_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_status ON rooms(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_created_at ON rooms(created_at DESC);
CREATE INDEX idx_rooms_search ON rooms USING gin(to_tsvector('english', 
  coalesce(room_number, '') || ' ' || 
  coalesce(room_name, '') || ' ' || 
  coalesce(department, '')
));

-- Trigger for updated_at
CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger
CREATE TRIGGER trg_rooms_audit
  AFTER INSERT OR UPDATE OR DELETE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();
```

---

## 🔐 Row Level Security (RLS)

### RLS Policies
```sql
-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active rooms
CREATE POLICY "rooms_select_active" ON rooms
  FOR SELECT
  USING (deleted_at IS NULL);

-- Policy: Admins can view all rooms (including deleted)
CREATE POLICY "rooms_select_admin" ON rooms
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'manager')
    )
  );

-- Policy: Facilities staff can insert rooms
CREATE POLICY "rooms_insert_facilities" ON rooms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'manager', 'facilities_staff')
    )
  );

-- Policy: Facilities staff can update rooms
CREATE POLICY "rooms_update_facilities" ON rooms
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'manager', 'facilities_staff')
    )
  );

-- Policy: Only admins can delete (soft delete)
CREATE POLICY "rooms_delete_admin" ON rooms
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin' AND
    deleted_at IS NULL
  )
  WITH CHECK (
    deleted_at IS NOT NULL
  );
```

---

## 📊 Data Migration

### Migration Steps
```sql
-- Migration: 20250102_rooms_table_stabilization.sql

-- Step 1: Backup existing data
CREATE TABLE rooms_backup AS SELECT * FROM rooms;

-- Step 2: Create new enums
CREATE TYPE room_type_enum AS ENUM (...);
CREATE TYPE room_status_enum AS ENUM (...);
CREATE TYPE operational_status_enum AS ENUM (...);

-- Step 3: Add new columns
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_name TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_subtype TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS square_footage DECIMAL(10,2);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS operational_status operational_status_enum DEFAULT 'operational';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_accessible BOOLEAN DEFAULT true;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_reservable BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_av_equipment BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_video_conference BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_whiteboard BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS wing TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS location_notes TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Step 4: Migrate existing data
UPDATE rooms SET 
  room_type = CASE 
    WHEN room_type = 'office' THEN 'office'::room_type_enum
    WHEN room_type = 'courtroom' THEN 'courtroom'::room_type_enum
    ELSE 'other'::room_type_enum
  END,
  status = CASE
    WHEN status = 'available' THEN 'available'::room_status_enum
    WHEN status = 'occupied' THEN 'occupied'::room_status_enum
    ELSE 'available'::room_status_enum
  END;

-- Step 5: Add constraints
ALTER TABLE rooms ADD CONSTRAINT uq_rooms_building_floor_number 
  UNIQUE (building_id, floor_id, room_number);
ALTER TABLE rooms ADD CONSTRAINT chk_rooms_capacity_positive 
  CHECK (capacity IS NULL OR capacity > 0);

-- Step 6: Create indexes
CREATE INDEX idx_rooms_building_id ON rooms(building_id) WHERE deleted_at IS NULL;
-- ... (all other indexes)

-- Step 7: Create triggers
CREATE TRIGGER trg_rooms_updated_at ...;
CREATE TRIGGER trg_rooms_audit ...;

-- Step 8: Apply RLS policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select_active" ...;
-- ... (all other policies)

-- Step 9: Verify migration
SELECT 
  COUNT(*) as total_rooms,
  COUNT(DISTINCT building_id) as buildings,
  COUNT(DISTINCT floor_id) as floors,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_rooms
FROM rooms;
```

### Rollback Plan
```sql
-- Rollback: Drop new constraints and restore from backup
DROP TABLE IF EXISTS rooms CASCADE;
CREATE TABLE rooms AS SELECT * FROM rooms_backup;
-- Recreate original indexes and constraints
```

---

## 🧪 Testing Plan

### Unit Tests
```sql
-- Test 1: Unique constraint enforcement
INSERT INTO rooms (room_number, building_id, floor_id, room_type)
VALUES ('101', 'building-uuid', 'floor-uuid', 'office');
-- Should fail on duplicate
INSERT INTO rooms (room_number, building_id, floor_id, room_type)
VALUES ('101', 'building-uuid', 'floor-uuid', 'office');

-- Test 2: Capacity validation
INSERT INTO rooms (room_number, building_id, floor_id, capacity)
VALUES ('102', 'building-uuid', 'floor-uuid', -5);
-- Should fail: capacity must be positive

-- Test 3: Foreign key constraints
INSERT INTO rooms (room_number, building_id, floor_id)
VALUES ('103', 'invalid-uuid', 'floor-uuid');
-- Should fail: invalid building_id

-- Test 4: Soft delete
UPDATE rooms SET deleted_at = NOW() WHERE room_number = '101';
SELECT * FROM rooms WHERE deleted_at IS NULL;
-- Should not include room 101

-- Test 5: RLS policies
SET ROLE regular_user;
SELECT * FROM rooms;
-- Should only see active rooms
```

### Integration Tests
- Verify frontend room list still loads
- Verify room creation form works
- Verify room edit form works
- Verify room search functionality
- Verify room filtering by building/floor

### Performance Tests
```sql
-- Benchmark: Room list query
EXPLAIN ANALYZE
SELECT r.*, b.name as building_name, f.name as floor_name
FROM rooms r
JOIN buildings b ON r.building_id = b.id
JOIN floors f ON r.floor_id = f.id
WHERE r.deleted_at IS NULL
ORDER BY r.room_number;
-- Target: < 50ms

-- Benchmark: Room search query
EXPLAIN ANALYZE
SELECT * FROM rooms
WHERE to_tsvector('english', room_number || ' ' || coalesce(room_name, ''))
  @@ to_tsquery('english', '101');
-- Target: < 100ms
```

---

## 📚 Documentation

### Table Documentation
```markdown
# Rooms Table

## Purpose
Stores information about all physical rooms in the courthouse facilities.

## Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| room_number | TEXT | No | - | Room identifier (e.g., "101", "2A") |
| room_name | TEXT | Yes | - | Descriptive name |
| building_id | UUID | No | - | Foreign key to buildings |
| floor_id | UUID | No | - | Foreign key to floors |
| room_type | room_type_enum | No | 'office' | Type of room |
| capacity | INTEGER | Yes | - | Maximum occupancy |
| status | room_status_enum | No | 'available' | Current status |
| created_at | TIMESTAMPTZ | No | NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | NOW() | Last update timestamp |

## Relationships
- **buildings** (many-to-one): Each room belongs to one building
- **floors** (many-to-one): Each room is on one floor
- **occupants** (one-to-many): Rooms can have multiple occupants
- **issues** (one-to-many): Rooms can have multiple issues
- **key_assignments** (one-to-many): Rooms can have multiple key assignments

## Indexes
- Primary key on `id`
- Unique index on `(building_id, floor_id, room_number)`
- Index on `building_id` for building queries
- Index on `floor_id` for floor queries
- Full-text search index on room_number and room_name

## Security
- RLS enabled
- Public read access for active rooms
- Write access restricted to facilities staff
- Delete access restricted to administrators
```

---

## 🔄 Dependencies

### Upstream Dependencies
- Buildings table must exist
- Floors table must exist
- Profiles table for audit fields
- User_roles table for RLS policies

### Downstream Dependencies
- Occupants table (foreign key to rooms)
- Issues table (foreign key to rooms)
- Key_assignments table (foreign key to rooms)
- Court_rooms table (foreign key to rooms)

---

## ⚠️ Risks & Mitigation

### Risk 1: Data Loss During Migration
- **Mitigation:** Full backup before migration, test in staging first

### Risk 2: Breaking Frontend Components
- **Mitigation:** Maintain backward compatibility, coordinate with frontend team

### Risk 3: Performance Degradation
- **Mitigation:** Create proper indexes, benchmark before/after

---

## ✅ Definition of Done

- [ ] Schema changes implemented and tested
- [ ] Migration script created and tested in staging
- [ ] RLS policies applied and verified
- [ ] Indexes created and performance tested
- [ ] Documentation updated
- [ ] Frontend team notified of changes
- [ ] Code review completed
- [ ] Merged to main branch
- [ ] Deployed to production
- [ ] Post-deployment verification completed

---

**Story Owner:** Backend Developer  
**Reviewer:** Database Admin  
**Created:** October 25, 2025  
**Last Updated:** October 25, 2025
