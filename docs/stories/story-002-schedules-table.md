# STORY-002: Schedules & Court Terms Table

**Story ID:** STORY-002  
**Epic:** [EPIC-001](../epics/epic-001-schema-stabilization.md) - Schema Stabilization  
**Title:** Stabilize Court Schedules and Terms Tables  
**Status:** 📋 To Do  
**Priority:** 🔴 Critical  
**Story Points:** 5  
**Sprint:** Sprint 1, Week 1 (Days 3-4)

---

## 📋 User Story

**As a** court administrator  
**I want** a stable scheduling system for court terms and assignments  
**So that** I can reliably manage court calendars and personnel assignments

---

## 🎯 Acceptance Criteria

### Must Have
- [ ] Court_terms table schema documented and stabilized
- [ ] Court_assignments table properly linked to terms
- [ ] Scheduling constraints enforced (no overlapping assignments)
- [ ] RLS policies for court scheduling data
- [ ] Migration script for existing court data
- [ ] Term upload functionality tested

### Should Have
- [ ] Term status workflow (draft, active, completed, archived)
- [ ] Assignment conflict detection
- [ ] Historical term data preservation
- [ ] Performance indexes for date range queries

---

## 🗄️ Current State

### Existing Tables
```sql
-- Current court_terms table
CREATE TABLE court_terms (
  id UUID PRIMARY KEY,
  term_name TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ
);

-- Current court_assignments table
CREATE TABLE court_assignments (
  id UUID PRIMARY KEY,
  court_room_id UUID REFERENCES court_rooms(id),
  term_id UUID REFERENCES court_terms(id),
  justice_name TEXT,
  clerk_names TEXT[],
  sergeant_name TEXT,
  sort_order INTEGER
);
```

### Current Data
- **Court Terms:** Multiple active terms
- **Court Assignments:** 32 courtrooms with assignments
- **Personnel:** 150+ court personnel (judges, clerks, sergeants)

---

## 🏗️ Proposed Schema

### Enhanced Court Terms Table
```sql
CREATE TABLE court_terms (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Term Information
  term_name TEXT NOT NULL,
  term_code TEXT UNIQUE NOT NULL,
  term_year INTEGER NOT NULL,
  term_session TEXT, -- 'spring', 'fall', 'summer'
  
  -- Date Range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status
  status term_status_enum NOT NULL DEFAULT 'draft',
  is_active BOOLEAN DEFAULT false,
  
  -- Metadata
  description TEXT,
  notes TEXT,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  -- Constraints
  CONSTRAINT chk_court_terms_dates CHECK (end_date >= start_date),
  CONSTRAINT chk_court_terms_year CHECK (term_year >= 2020 AND term_year <= 2100),
  CONSTRAINT uq_court_terms_code UNIQUE (term_code)
);

CREATE TYPE term_status_enum AS ENUM (
  'draft',
  'scheduled',
  'active',
  'completed',
  'cancelled',
  'archived'
);

-- Indexes
CREATE INDEX idx_court_terms_dates ON court_terms(start_date, end_date);
CREATE INDEX idx_court_terms_status ON court_terms(status);
CREATE INDEX idx_court_terms_active ON court_terms(is_active) WHERE is_active = true;
CREATE INDEX idx_court_terms_year ON court_terms(term_year);
```

### Enhanced Court Assignments Table
```sql
CREATE TABLE court_assignments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  court_room_id UUID NOT NULL REFERENCES court_rooms(id) ON DELETE RESTRICT,
  term_id UUID NOT NULL REFERENCES court_terms(id) ON DELETE CASCADE,
  
  -- Personnel (using personnel_profiles)
  justice_id UUID REFERENCES personnel_profiles(id),
  justice_name TEXT, -- Denormalized for display
  clerk_ids UUID[], -- Array of clerk IDs
  clerk_names TEXT[], -- Denormalized for display
  sergeant_id UUID REFERENCES personnel_profiles(id),
  sergeant_name TEXT, -- Denormalized for display
  
  -- Assignment Details
  assignment_type TEXT DEFAULT 'regular', -- 'regular', 'temporary', 'special'
  priority INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  
  -- Status
  status assignment_status_enum NOT NULL DEFAULT 'assigned',
  is_active BOOLEAN DEFAULT true,
  
  -- Notes
  notes TEXT,
  special_instructions TEXT,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  -- Constraints
  CONSTRAINT uq_court_assignments_room_term UNIQUE (court_room_id, term_id),
  CONSTRAINT chk_court_assignments_priority CHECK (priority >= 0)
);

CREATE TYPE assignment_status_enum AS ENUM (
  'assigned',
  'confirmed',
  'temporary',
  'pending',
  'cancelled'
);

-- Indexes
CREATE INDEX idx_court_assignments_court_room ON court_assignments(court_room_id);
CREATE INDEX idx_court_assignments_term ON court_assignments(term_id);
CREATE INDEX idx_court_assignments_justice ON court_assignments(justice_id);
CREATE INDEX idx_court_assignments_status ON court_assignments(status);
CREATE INDEX idx_court_assignments_active ON court_assignments(is_active) WHERE is_active = true;
```

---

## 🔐 Row Level Security

```sql
-- Court Terms RLS
ALTER TABLE court_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "court_terms_select_all" ON court_terms
  FOR SELECT USING (true); -- All authenticated users can view terms

CREATE POLICY "court_terms_modify_admin" ON court_terms
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'court_operations')
    )
  );

-- Court Assignments RLS
ALTER TABLE court_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "court_assignments_select_all" ON court_assignments
  FOR SELECT USING (true);

CREATE POLICY "court_assignments_modify_admin" ON court_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'court_operations')
    )
  );
```

---

## 📊 Data Migration

```sql
-- Migration: 20250103_schedules_table_stabilization.sql

-- Step 1: Backup
CREATE TABLE court_terms_backup AS SELECT * FROM court_terms;
CREATE TABLE court_assignments_backup AS SELECT * FROM court_assignments;

-- Step 2: Create enums
CREATE TYPE term_status_enum AS ENUM (...);
CREATE TYPE assignment_status_enum AS ENUM (...);

-- Step 3: Add new columns to court_terms
ALTER TABLE court_terms ADD COLUMN term_code TEXT;
ALTER TABLE court_terms ADD COLUMN term_year INTEGER;
ALTER TABLE court_terms ADD COLUMN term_session TEXT;
ALTER TABLE court_terms ADD COLUMN status term_status_enum DEFAULT 'active';
ALTER TABLE court_terms ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE court_terms ADD COLUMN description TEXT;
ALTER TABLE court_terms ADD COLUMN notes TEXT;
ALTER TABLE court_terms ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE court_terms ADD COLUMN created_by UUID REFERENCES profiles(id);
ALTER TABLE court_terms ADD COLUMN updated_by UUID REFERENCES profiles(id);

-- Step 4: Populate new columns
UPDATE court_terms SET
  term_code = COALESCE(term_name, id::text),
  term_year = EXTRACT(YEAR FROM start_date)::INTEGER,
  status = 'active'::term_status_enum,
  is_active = (end_date >= CURRENT_DATE);

-- Step 5: Add constraints
ALTER TABLE court_terms ADD CONSTRAINT chk_court_terms_dates 
  CHECK (end_date >= start_date);
ALTER TABLE court_terms ADD CONSTRAINT uq_court_terms_code 
  UNIQUE (term_code);

-- Step 6: Enhance court_assignments
ALTER TABLE court_assignments ADD COLUMN justice_id UUID REFERENCES personnel_profiles(id);
ALTER TABLE court_assignments ADD COLUMN clerk_ids UUID[];
ALTER TABLE court_assignments ADD COLUMN sergeant_id UUID REFERENCES personnel_profiles(id);
ALTER TABLE court_assignments ADD COLUMN assignment_type TEXT DEFAULT 'regular';
ALTER TABLE court_assignments ADD COLUMN priority INTEGER DEFAULT 0;
ALTER TABLE court_assignments ADD COLUMN status assignment_status_enum DEFAULT 'assigned';
ALTER TABLE court_assignments ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE court_assignments ADD COLUMN notes TEXT;
ALTER TABLE court_assignments ADD COLUMN special_instructions TEXT;
ALTER TABLE court_assignments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE court_assignments ADD COLUMN created_by UUID REFERENCES profiles(id);
ALTER TABLE court_assignments ADD COLUMN updated_by UUID REFERENCES profiles(id);

-- Step 7: Create indexes
CREATE INDEX idx_court_terms_dates ON court_terms(start_date, end_date);
CREATE INDEX idx_court_assignments_court_room ON court_assignments(court_room_id);
-- ... (all other indexes)

-- Step 8: Apply RLS
ALTER TABLE court_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_assignments ENABLE ROW LEVEL SECURITY;
-- ... (all policies)
```

---

## 🧪 Testing Plan

### Functional Tests
```sql
-- Test 1: Term date validation
INSERT INTO court_terms (term_name, term_code, term_year, start_date, end_date)
VALUES ('Test Term', 'TEST-2025', 2025, '2025-09-01', '2025-08-01');
-- Should fail: end_date before start_date

-- Test 2: Unique term code
INSERT INTO court_terms (term_name, term_code, term_year, start_date, end_date)
VALUES ('Term 1', 'FALL-2025', 2025, '2025-09-01', '2025-12-31');
INSERT INTO court_terms (term_name, term_code, term_year, start_date, end_date)
VALUES ('Term 2', 'FALL-2025', 2025, '2025-09-01', '2025-12-31');
-- Should fail: duplicate term_code

-- Test 3: Assignment uniqueness
INSERT INTO court_assignments (court_room_id, term_id, justice_name)
VALUES ('room-uuid', 'term-uuid', 'Judge Smith');
INSERT INTO court_assignments (court_room_id, term_id, justice_name)
VALUES ('room-uuid', 'term-uuid', 'Judge Jones');
-- Should fail: duplicate room-term assignment

-- Test 4: Cascade delete
DELETE FROM court_terms WHERE id = 'term-uuid';
-- Should cascade delete all assignments for that term
```

### Performance Tests
```sql
-- Query: Get active term with all assignments
EXPLAIN ANALYZE
SELECT t.*, 
  json_agg(ca.*) as assignments
FROM court_terms t
LEFT JOIN court_assignments ca ON ca.term_id = t.id
WHERE t.is_active = true
GROUP BY t.id;
-- Target: < 100ms
```

---

## 📚 Documentation

### Term Workflow
```
Draft → Scheduled → Active → Completed → Archived
                         ↓
                    Cancelled
```

### Assignment Process
1. Create term with date range
2. Upload or create court assignments
3. Assign personnel (justice, clerks, sergeant)
4. Activate term
5. Monitor and update as needed
6. Complete term when finished

---

## ✅ Definition of Done

- [ ] Schema changes implemented
- [ ] Migration tested in staging
- [ ] RLS policies verified
- [ ] Term upload functionality working
- [ ] Assignment conflict detection working
- [ ] Documentation complete
- [ ] Code review passed
- [ ] Deployed to production

---

**Story Owner:** Backend Developer  
**Created:** October 25, 2025
