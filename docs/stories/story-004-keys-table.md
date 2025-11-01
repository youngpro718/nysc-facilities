# STORY-004: Keys & Access Management Tables

**Story ID:** STORY-004  
**Epic:** [EPIC-001](../epics/epic-001-schema-stabilization.md) - Schema Stabilization  
**Title:** Stabilize Keys, Assignments, Requests, and Orders Tables  
**Status:** 📋 To Do  
**Priority:** 🔴 Critical  
**Story Points:** 8  
**Sprint:** Sprint 1, Week 2 (Days 1-2)

---

## 📋 User Story

**As a** security administrator  
**I want** a comprehensive key management system  
**So that** I can track all keys, assignments, requests, and maintain security compliance

---

## 🎯 Acceptance Criteria

- [ ] Keys table schema stabilized with proper constraints
- [ ] Key_assignments table with audit trail
- [ ] Key_requests workflow table enhanced
- [ ] Key_orders procurement table stabilized
- [ ] Key_audit_logs comprehensive logging
- [ ] Elevator_passes integrated
- [ ] RLS policies for all key tables
- [ ] Migration scripts tested

---

## 🗄️ Current State

### Existing Tables
- `keys` (8 records) - Key inventory
- `key_assignments` (11 active) - Current assignments
- `key_requests` (6 requests) - Request workflow
- `key_orders` (5 orders) - Procurement
- `key_audit_logs` (27 entries) - Audit trail
- `elevator_passes` - Access passes

---

## 🏗️ Proposed Schema

### Enhanced Keys Table
```sql
CREATE TABLE keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Key Identification
  key_number TEXT NOT NULL UNIQUE,
  key_code TEXT,
  key_type key_type_enum NOT NULL DEFAULT 'physical',
  
  -- Access Scope
  room_id UUID REFERENCES rooms(id),
  building_id UUID REFERENCES buildings(id),
  floor_id UUID REFERENCES floors(id),
  access_level access_level_enum NOT NULL DEFAULT 'room',
  
  -- Key Details
  description TEXT,
  manufacturer TEXT,
  key_pattern TEXT,
  is_master_key BOOLEAN DEFAULT false,
  is_grand_master BOOLEAN DEFAULT false,
  
  -- Inventory
  total_quantity INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity >= 0),
  available_quantity INTEGER NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
  captain_office_copy BOOLEAN DEFAULT false,
  
  -- Status
  status key_status_enum NOT NULL DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT chk_keys_quantity_valid 
    CHECK (available_quantity <= total_quantity),
  CONSTRAINT chk_keys_access_scope
    CHECK (
      (access_level = 'room' AND room_id IS NOT NULL) OR
      (access_level = 'floor' AND floor_id IS NOT NULL) OR
      (access_level = 'building' AND building_id IS NOT NULL) OR
      (access_level = 'master')
    )
);

CREATE TYPE key_type_enum AS ENUM ('physical', 'electronic', 'card', 'fob', 'code');
CREATE TYPE access_level_enum AS ENUM ('room', 'floor', 'building', 'master', 'grand_master');
CREATE TYPE key_status_enum AS ENUM ('active', 'inactive', 'lost', 'damaged', 'retired');

CREATE INDEX idx_keys_key_number ON keys(key_number);
CREATE INDEX idx_keys_room ON keys(room_id);
CREATE INDEX idx_keys_building ON keys(building_id);
CREATE INDEX idx_keys_status ON keys(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_keys_master ON keys(is_master_key) WHERE is_master_key = true;
```

### Enhanced Key Assignments Table
```sql
CREATE TABLE key_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  key_id UUID NOT NULL REFERENCES keys(id) ON DELETE RESTRICT,
  occupant_id UUID NOT NULL REFERENCES occupants(id) ON DELETE RESTRICT,
  assigned_by UUID REFERENCES profiles(id),
  
  -- Assignment Details
  assignment_type assignment_type_enum NOT NULL DEFAULT 'permanent',
  assignment_reason TEXT,
  expected_return_date DATE,
  
  -- Status
  status assignment_status_enum NOT NULL DEFAULT 'active',
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  returned_date DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  key_condition condition_enum DEFAULT 'good',
  return_condition condition_enum,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_key_assignments_dates 
    CHECK (returned_date IS NULL OR returned_date >= issued_date),
  CONSTRAINT chk_key_assignments_active
    CHECK (
      (is_active = true AND returned_date IS NULL) OR
      (is_active = false AND returned_date IS NOT NULL)
    )
);

CREATE TYPE assignment_type_enum AS ENUM ('permanent', 'temporary', 'emergency', 'loaner');
CREATE TYPE assignment_status_enum AS ENUM ('active', 'returned', 'lost', 'overdue', 'cancelled');
CREATE TYPE condition_enum AS ENUM ('excellent', 'good', 'fair', 'poor', 'damaged', 'lost');

CREATE INDEX idx_key_assignments_key ON key_assignments(key_id);
CREATE INDEX idx_key_assignments_occupant ON key_assignments(occupant_id);
CREATE INDEX idx_key_assignments_active ON key_assignments(is_active) WHERE is_active = true;
CREATE INDEX idx_key_assignments_overdue ON key_assignments(expected_return_date) 
  WHERE is_active = true AND expected_return_date < CURRENT_DATE;
```

### Enhanced Key Requests Table
```sql
CREATE TABLE key_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Requester
  requester_id UUID NOT NULL REFERENCES profiles(id),
  occupant_id UUID REFERENCES occupants(id),
  
  -- Request Details
  key_id UUID REFERENCES keys(id),
  room_id UUID REFERENCES rooms(id),
  request_type request_type_enum NOT NULL DEFAULT 'new',
  reason TEXT NOT NULL,
  urgency urgency_enum NOT NULL DEFAULT 'normal',
  
  -- Workflow
  status request_status_enum NOT NULL DEFAULT 'pending',
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approved_date DATE,
  fulfilled_date DATE,
  rejected_date DATE,
  
  -- Approval
  approved_by UUID REFERENCES profiles(id),
  rejected_by UUID REFERENCES profiles(id),
  approval_notes TEXT,
  rejection_reason TEXT,
  
  -- Fulfillment
  fulfilled_by UUID REFERENCES profiles(id),
  assignment_id UUID REFERENCES key_assignments(id),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_key_requests_key_or_room
    CHECK (key_id IS NOT NULL OR room_id IS NOT NULL)
);

CREATE TYPE request_type_enum AS ENUM ('new', 'replacement', 'additional', 'temporary');
CREATE TYPE urgency_enum AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE request_status_enum AS ENUM ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled');

CREATE INDEX idx_key_requests_requester ON key_requests(requester_id);
CREATE INDEX idx_key_requests_status ON key_requests(status);
CREATE INDEX idx_key_requests_pending ON key_requests(status) WHERE status = 'pending';
```

### Enhanced Key Orders Table
```sql
CREATE TABLE key_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order Details
  order_number TEXT UNIQUE NOT NULL,
  key_id UUID NOT NULL REFERENCES keys(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  
  -- Procurement
  vendor TEXT,
  cost DECIMAL(10,2) CHECK (cost >= 0),
  purchase_order_number TEXT,
  
  -- Status
  status order_status_enum NOT NULL DEFAULT 'pending',
  ordered_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  received_date DATE,
  
  -- Fulfillment
  ordered_by UUID REFERENCES profiles(id),
  received_by UUID REFERENCES profiles(id),
  quantity_received INTEGER CHECK (quantity_received >= 0),
  
  -- Notes
  notes TEXT,
  receiving_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE order_status_enum AS ENUM ('pending', 'ordered', 'shipped', 'received', 'cancelled');

CREATE INDEX idx_key_orders_key ON key_orders(key_id);
CREATE INDEX idx_key_orders_status ON key_orders(status);
CREATE INDEX idx_key_orders_pending ON key_orders(status) WHERE status IN ('pending', 'ordered', 'shipped');
```

### Key Audit Logs Table
```sql
CREATE TABLE key_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  key_id UUID REFERENCES keys(id),
  assignment_id UUID REFERENCES key_assignments(id),
  request_id UUID REFERENCES key_requests(id),
  order_id UUID REFERENCES key_orders(id),
  
  -- Action
  action audit_action_enum NOT NULL,
  action_description TEXT NOT NULL,
  
  -- Actor
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Context
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE audit_action_enum AS ENUM (
  'key_created', 'key_updated', 'key_deleted',
  'key_assigned', 'key_returned', 'key_lost',
  'request_created', 'request_approved', 'request_rejected', 'request_fulfilled',
  'order_created', 'order_received', 'order_cancelled'
);

CREATE INDEX idx_key_audit_logs_key ON key_audit_logs(key_id);
CREATE INDEX idx_key_audit_logs_assignment ON key_audit_logs(assignment_id);
CREATE INDEX idx_key_audit_logs_action ON key_audit_logs(action);
CREATE INDEX idx_key_audit_logs_performed_at ON key_audit_logs(performed_at DESC);
CREATE INDEX idx_key_audit_logs_performed_by ON key_audit_logs(performed_by);
```

---

## 🔐 Row Level Security

```sql
-- Keys table RLS
ALTER TABLE keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "keys_select_all" ON keys
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "keys_modify_admin" ON keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );

-- Key Assignments RLS
ALTER TABLE key_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "key_assignments_select_own" ON key_assignments
  FOR SELECT
  USING (
    occupant_id IN (
      SELECT id FROM occupants WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );

-- Key Requests RLS
ALTER TABLE key_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "key_requests_select_own" ON key_requests
  FOR SELECT
  USING (
    requester_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );

CREATE POLICY "key_requests_insert_authenticated" ON key_requests
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Audit Logs RLS (read-only for admins)
ALTER TABLE key_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "key_audit_logs_select_admin" ON key_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'security_admin')
    )
  );
```

---

## 📊 Data Migration

```sql
-- Migration: 20250105_keys_tables_stabilization.sql

-- Backup existing data
CREATE TABLE keys_backup AS SELECT * FROM keys;
CREATE TABLE key_assignments_backup AS SELECT * FROM key_assignments;
CREATE TABLE key_requests_backup AS SELECT * FROM key_requests;
CREATE TABLE key_orders_backup AS SELECT * FROM key_orders;

-- Create enums
CREATE TYPE key_type_enum AS ENUM (...);
CREATE TYPE access_level_enum AS ENUM (...);
-- ... (all other enums)

-- Enhance keys table
ALTER TABLE keys ADD COLUMN IF NOT EXISTS key_type key_type_enum DEFAULT 'physical';
ALTER TABLE keys ADD COLUMN IF NOT EXISTS access_level access_level_enum DEFAULT 'room';
ALTER TABLE keys ADD COLUMN IF NOT EXISTS is_master_key BOOLEAN DEFAULT false;
-- ... (all other columns)

-- Migrate existing data
UPDATE keys SET
  key_type = 'physical'::key_type_enum,
  access_level = CASE
    WHEN room_id IS NOT NULL THEN 'room'::access_level_enum
    WHEN building_id IS NOT NULL THEN 'building'::access_level_enum
    ELSE 'master'::access_level_enum
  END,
  is_master_key = (key_number LIKE '%M%');

-- Create indexes
CREATE INDEX idx_keys_key_number ON keys(key_number);
-- ... (all other indexes)

-- Apply RLS
ALTER TABLE keys ENABLE ROW LEVEL SECURITY;
-- ... (all policies)
```

---

## 🧪 Testing

```sql
-- Test: Key quantity validation
UPDATE keys SET available_quantity = 10, total_quantity = 5 WHERE id = 'key-uuid';
-- Should fail: available > total

-- Test: Assignment tracking
INSERT INTO key_assignments (key_id, occupant_id, assignment_type)
VALUES ('key-uuid', 'occupant-uuid', 'permanent');

SELECT * FROM keys WHERE id = 'key-uuid';
-- available_quantity should decrease

-- Test: Request workflow
INSERT INTO key_requests (requester_id, room_id, reason)
VALUES (auth.uid(), 'room-uuid', 'Need access for new assignment');

UPDATE key_requests SET status = 'approved', approved_by = 'admin-uuid'
WHERE id = 'request-uuid';

-- Test: Audit logging
SELECT * FROM key_audit_logs 
WHERE key_id = 'key-uuid'
ORDER BY performed_at DESC;
```

---

## ✅ Definition of Done

- [ ] All key tables schema stabilized
- [ ] Enums created for all status fields
- [ ] Constraints and indexes applied
- [ ] RLS policies implemented
- [ ] Audit logging functional
- [ ] Migration tested in staging
- [ ] Key workflow tested end-to-end
- [ ] Documentation complete
- [ ] Code review passed
- [ ] Deployed to production

---

**Story Owner:** Backend Developer  
**Created:** October 25, 2025
