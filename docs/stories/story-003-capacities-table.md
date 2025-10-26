# STORY-003: Room Capacities & Occupancy Table

**Story ID:** STORY-003  
**Epic:** [EPIC-001](../epics/epic-001-schema-stabilization.md) - Schema Stabilization  
**Title:** Implement Room Capacity Tracking System  
**Status:** 📋 To Do  
**Priority:** 🟡 High  
**Story Points:** 3  
**Sprint:** Sprint 1, Week 1 (Day 5)

---

## 📋 User Story

**As a** facilities manager  
**I want** to track room capacity and current occupancy  
**So that** I can ensure rooms are not over-assigned and maintain safety compliance

---

## 🎯 Acceptance Criteria

- [ ] Room capacity constraints added to rooms table
- [ ] Occupancy tracking table created
- [ ] Capacity validation rules enforced
- [ ] Occupancy calculations automated
- [ ] RLS policies applied
- [ ] Migration script tested

---

## 🏗️ Proposed Schema

### Enhanced Rooms Table (Capacity Fields)
```sql
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_capacity INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS ada_capacity INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS standing_capacity INTEGER;

ALTER TABLE rooms ADD CONSTRAINT chk_rooms_capacity_valid
  CHECK (
    capacity IS NULL OR 
    (capacity > 0 AND capacity <= COALESCE(max_capacity, capacity))
  );
```

### Room Occupancy Table
```sql
CREATE TABLE room_occupancy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  occupant_id UUID REFERENCES occupants(id) ON DELETE CASCADE,
  
  -- Occupancy Details
  occupancy_type occupancy_type_enum NOT NULL DEFAULT 'primary',
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  
  -- Capacity Impact
  occupancy_count INTEGER DEFAULT 1 CHECK (occupancy_count > 0),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  CONSTRAINT uq_room_occupancy_current 
    UNIQUE (room_id, occupant_id, is_current)
    WHERE is_current = true
);

CREATE TYPE occupancy_type_enum AS ENUM (
  'primary',
  'secondary',
  'temporary',
  'shared',
  'visitor'
);

-- Indexes
CREATE INDEX idx_room_occupancy_room ON room_occupancy(room_id);
CREATE INDEX idx_room_occupancy_occupant ON room_occupancy(occupant_id);
CREATE INDEX idx_room_occupancy_current ON room_occupancy(is_current) 
  WHERE is_current = true;
CREATE INDEX idx_room_occupancy_dates ON room_occupancy(start_date, end_date);
```

### Capacity View
```sql
CREATE OR REPLACE VIEW room_capacity_status AS
SELECT 
  r.id as room_id,
  r.room_number,
  r.capacity,
  r.max_capacity,
  COUNT(ro.id) FILTER (WHERE ro.is_current = true) as current_occupancy,
  r.capacity - COUNT(ro.id) FILTER (WHERE ro.is_current = true) as available_capacity,
  CASE 
    WHEN COUNT(ro.id) FILTER (WHERE ro.is_current = true) >= r.capacity THEN 'full'
    WHEN COUNT(ro.id) FILTER (WHERE ro.is_current = true) >= r.capacity * 0.8 THEN 'near_full'
    ELSE 'available'
  END as capacity_status
FROM rooms r
LEFT JOIN room_occupancy ro ON r.id = ro.room_id
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.room_number, r.capacity, r.max_capacity;
```

---

## 🔐 Row Level Security

```sql
ALTER TABLE room_occupancy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_occupancy_select_all" ON room_occupancy
  FOR SELECT USING (true);

CREATE POLICY "room_occupancy_modify_facilities" ON room_occupancy
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'facilities_staff')
    )
  );
```

---

## 📊 Data Migration

```sql
-- Migration: 20250104_capacities_table.sql

-- Add capacity fields to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_capacity INTEGER;

-- Set default capacities based on room type
UPDATE rooms SET 
  capacity = CASE room_type
    WHEN 'courtroom' THEN 100
    WHEN 'office' THEN 4
    WHEN 'conference' THEN 20
    ELSE 10
  END
WHERE capacity IS NULL;

-- Create occupancy table
CREATE TABLE room_occupancy (...);

-- Migrate existing occupant data
INSERT INTO room_occupancy (room_id, occupant_id, occupancy_type, start_date, is_current)
SELECT 
  room_id,
  id as occupant_id,
  'primary' as occupancy_type,
  COALESCE(created_at::date, CURRENT_DATE) as start_date,
  true as is_current
FROM occupants
WHERE room_id IS NOT NULL;
```

---

## 🧪 Testing

```sql
-- Test: Capacity validation
UPDATE rooms SET capacity = -5 WHERE id = 'room-uuid';
-- Should fail

-- Test: Over-capacity detection
SELECT * FROM room_capacity_status WHERE capacity_status = 'full';

-- Test: Occupancy tracking
INSERT INTO room_occupancy (room_id, occupant_id, occupancy_type, start_date)
VALUES ('room-uuid', 'occupant-uuid', 'primary', CURRENT_DATE);
```

---

## ✅ Definition of Done

- [ ] Capacity fields added to rooms
- [ ] Occupancy table created
- [ ] Validation constraints working
- [ ] Capacity view functional
- [ ] RLS policies applied
- [ ] Migration tested
- [ ] Documentation complete

---

**Story Owner:** Backend Developer  
**Created:** October 25, 2025
