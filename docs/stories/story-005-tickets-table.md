# STORY-005: Issues & Tickets System

**Story ID:** STORY-005  
**Epic:** [EPIC-001](../epics/epic-001-schema-stabilization.md) - Schema Stabilization  
**Title:** Stabilize Issues/Tickets Table and Workflow  
**Status:** 📋 To Do  
**Priority:** 🔴 Critical  
**Story Points:** 5  
**Sprint:** Sprint 1, Week 2 (Days 3-4)

---

## 📋 User Story

**As a** facilities staff member  
**I want** a comprehensive issue tracking system  
**So that** I can report, track, and resolve facility problems efficiently

---

## 🎯 Acceptance Criteria

- [ ] Issues table schema stabilized with proper workflow
- [ ] Issue categories and priorities defined
- [ ] Assignment and escalation workflow
- [ ] Issue history and comments tracking
- [ ] RLS policies for issue visibility
- [ ] Migration script tested

---

## 🗄️ Current State

- `issues` table (2 active issues)
- Related to rooms, buildings, floors
- Basic status tracking
- Limited workflow support

---

## 🏗️ Proposed Schema

### Enhanced Issues Table
```sql
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Issue Identification
  issue_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Location
  building_id UUID REFERENCES buildings(id),
  floor_id UUID REFERENCES floors(id),
  room_id UUID REFERENCES rooms(id),
  location_description TEXT,
  
  -- Classification
  category issue_category_enum NOT NULL,
  subcategory TEXT,
  issue_type issue_type_enum NOT NULL DEFAULT 'maintenance',
  priority priority_enum NOT NULL DEFAULT 'medium',
  severity severity_enum NOT NULL DEFAULT 'minor',
  
  -- Status & Workflow
  status issue_status_enum NOT NULL DEFAULT 'open',
  resolution_type resolution_type_enum,
  resolution_notes TEXT,
  
  -- Assignment
  reported_by UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  assigned_team TEXT,
  
  -- Dates
  reported_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_date TIMESTAMPTZ,
  started_date TIMESTAMPTZ,
  resolved_date TIMESTAMPTZ,
  closed_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  
  -- Impact
  affects_operations BOOLEAN DEFAULT false,
  affects_safety BOOLEAN DEFAULT false,
  estimated_cost DECIMAL(10,2),
  
  -- Attachments & References
  attachments JSONB DEFAULT '[]'::jsonb,
  related_issues UUID[],
  work_order_number TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  CONSTRAINT chk_issues_dates CHECK (
    resolved_date IS NULL OR resolved_date >= reported_date
  )
);

-- Enums
CREATE TYPE issue_category_enum AS ENUM (
  'maintenance', 'repair', 'cleaning', 'hvac', 'electrical',
  'plumbing', 'security', 'safety', 'accessibility', 'other'
);

CREATE TYPE issue_type_enum AS ENUM (
  'maintenance', 'repair', 'inspection', 'complaint', 'request', 'emergency'
);

CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');
CREATE TYPE severity_enum AS ENUM ('minor', 'moderate', 'major', 'critical');

CREATE TYPE issue_status_enum AS ENUM (
  'open', 'acknowledged', 'assigned', 'in_progress', 
  'on_hold', 'resolved', 'closed', 'cancelled'
);

CREATE TYPE resolution_type_enum AS ENUM (
  'fixed', 'workaround', 'duplicate', 'cannot_reproduce', 
  'wont_fix', 'deferred', 'external'
);

-- Indexes
CREATE INDEX idx_issues_number ON issues(issue_number);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_room ON issues(room_id);
CREATE INDEX idx_issues_building ON issues(building_id);
CREATE INDEX idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX idx_issues_reported_by ON issues(reported_by);
CREATE INDEX idx_issues_reported_date ON issues(reported_date DESC);
CREATE INDEX idx_issues_open ON issues(status) 
  WHERE status IN ('open', 'acknowledged', 'assigned', 'in_progress');
CREATE INDEX idx_issues_urgent ON issues(priority) 
  WHERE priority IN ('urgent', 'critical');
CREATE INDEX idx_issues_search ON issues USING gin(to_tsvector('english',
  coalesce(title, '') || ' ' || coalesce(description, '')
));
```

### Issue Comments Table
```sql
CREATE TABLE issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  
  -- Comment
  comment TEXT NOT NULL,
  comment_type comment_type_enum NOT NULL DEFAULT 'comment',
  is_internal BOOLEAN DEFAULT false,
  
  -- Author
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb
);

CREATE TYPE comment_type_enum AS ENUM (
  'comment', 'status_change', 'assignment', 'resolution', 'escalation'
);

CREATE INDEX idx_issue_comments_issue ON issue_comments(issue_id);
CREATE INDEX idx_issue_comments_created_at ON issue_comments(created_at DESC);
```

### Issue History Table
```sql
CREATE TABLE issue_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  
  -- Change Details
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_type TEXT NOT NULL,
  
  -- Actor
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Context
  change_reason TEXT,
  metadata JSONB
);

CREATE INDEX idx_issue_history_issue ON issue_history(issue_id);
CREATE INDEX idx_issue_history_changed_at ON issue_history(changed_at DESC);
```

---

## 🔐 Row Level Security

```sql
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Everyone can view non-internal issues
CREATE POLICY "issues_select_public" ON issues
  FOR SELECT
  USING (true);

-- Users can create issues
CREATE POLICY "issues_insert_authenticated" ON issues
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Assigned users and facilities staff can update
CREATE POLICY "issues_update_assigned" ON issues
  FOR UPDATE
  USING (
    assigned_to = auth.uid() OR
    reported_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'facilities_staff')
    )
  );

-- Comments RLS
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "issue_comments_select_all" ON issue_comments
  FOR SELECT
  USING (
    NOT is_internal OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('administrator', 'facilities_staff')
    )
  );

CREATE POLICY "issue_comments_insert_authenticated" ON issue_comments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 📊 Data Migration

```sql
-- Migration: 20250106_tickets_table_stabilization.sql

-- Backup
CREATE TABLE issues_backup AS SELECT * FROM issues;

-- Create enums
CREATE TYPE issue_category_enum AS ENUM (...);
-- ... (all enums)

-- Add new columns
ALTER TABLE issues ADD COLUMN IF NOT EXISTS issue_number TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS category issue_category_enum;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS issue_type issue_type_enum DEFAULT 'maintenance';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS severity severity_enum DEFAULT 'minor';
-- ... (all other columns)

-- Generate issue numbers for existing records
UPDATE issues SET issue_number = 'ISS-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 6, '0')
WHERE issue_number IS NULL;

-- Migrate existing data
UPDATE issues SET
  category = 'maintenance'::issue_category_enum,
  issue_type = 'maintenance'::issue_type_enum,
  severity = CASE priority
    WHEN 'urgent' THEN 'critical'::severity_enum
    WHEN 'high' THEN 'major'::severity_enum
    ELSE 'minor'::severity_enum
  END;

-- Create supporting tables
CREATE TABLE issue_comments (...);
CREATE TABLE issue_history (...);

-- Create indexes
CREATE INDEX idx_issues_number ON issues(issue_number);
-- ... (all indexes)

-- Apply RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
-- ... (all policies)
```

---

## 🧪 Testing

```sql
-- Test: Issue creation
INSERT INTO issues (title, description, category, priority, reported_by, room_id)
VALUES ('Broken light', 'Light fixture not working', 'electrical', 'high', auth.uid(), 'room-uuid');

-- Test: Issue workflow
UPDATE issues SET status = 'assigned', assigned_to = 'staff-uuid' WHERE id = 'issue-uuid';
UPDATE issues SET status = 'in_progress', started_date = NOW() WHERE id = 'issue-uuid';
UPDATE issues SET status = 'resolved', resolved_date = NOW(), resolution_type = 'fixed' WHERE id = 'issue-uuid';

-- Test: Comments
INSERT INTO issue_comments (issue_id, comment, created_by)
VALUES ('issue-uuid', 'Working on this now', auth.uid());

-- Test: Search
SELECT * FROM issues 
WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', 'light');
```

---

## ✅ Definition of Done

- [ ] Issues table schema complete
- [ ] Workflow statuses defined
- [ ] Comments and history tables created
- [ ] RLS policies applied
- [ ] Migration tested
- [ ] Issue workflow tested
- [ ] Documentation complete
- [ ] Deployed to production

---

**Story Owner:** Backend Developer  
**Created:** October 25, 2025
