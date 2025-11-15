# Epic 001: Schema Stabilization

**Epic ID:** EPIC-001  
**Title:** Database Schema Stabilization & Migration Framework  
**Status:** ✅ Complete  
**Priority:** 🔴 Critical  
**Target:** Sprint 1-2 (4 weeks)  
**Owner:** Backend Team  
**Created:** October 25, 2025  
**Completed:** October 25, 2025

---

## 📋 Executive Summary

Stabilize the NYSC Facilities database schema to provide a solid foundation for court operations. This epic focuses on defining, documenting, and migrating core tables (rooms, schedules, capacities, keys, tickets, audit logs) with proper relationships, constraints, and Row Level Security (RLS) policies.

---

## 🎯 Goals & Objectives

### Primary Goals
1. **Stable Schema Foundation** - Define and document all core tables with proper relationships
2. **Migration Framework** - Establish versioned migration system for schema changes
3. **Data Integrity** - Implement constraints, indexes, and validation rules
4. **Security Baseline** - Apply RLS policies to all sensitive tables
5. **Audit Trail** - Comprehensive logging for all critical operations

### Success Criteria
- ✅ All core tables documented with ERD diagrams
- ✅ Migration scripts tested and version-controlled
- ✅ RLS policies applied and tested for all tables
- ✅ Seed data scripts for development/testing
- ✅ Zero breaking changes to existing functionality
- ✅ Performance benchmarks established

---

## 🗄️ Current State Analysis

### Existing Database Structure
Based on brownfield analysis, the current database includes:

#### **Core Tables (Existing)**
- `buildings` (2 records) - Building information
- `floors` (15 records) - Floor layout
- `rooms` (94 records) - Room inventory
- `court_rooms` (32 records) - Courtroom-specific data
- `issues` (2 active) - Facility issues
- `keys` (8 keys) - Key inventory
- `key_assignments` (11 active) - Key distribution
- `key_requests` (6 requests) - Key request workflow
- `profiles` - User profiles
- `personnel_profiles` (150+ records) - Court personnel
- `occupants` - Room occupancy

#### **Supporting Tables**
- `maintenance_schedule` - Scheduled maintenance
- `court_assignments` - Court term assignments
- `court_terms` - Court scheduling
- `inventory_items` - Supply inventory
- `supply_requests` - Supply request workflow

#### **Views & Functions**
- `unified_spaces` - Combined spatial view
- `key_inventory_view` - Aggregated key data
- `personnel_profiles_view` - Personnel aggregation
- `get_dashboard_stats()` - Dashboard RPC
- `create_key_order()` - Key ordering RPC

### Identified Issues
1. **Schema Documentation** - Limited ERD and relationship documentation
2. **Migration Management** - 40+ migration files need organization
3. **Constraint Gaps** - Some foreign keys and checks missing
4. **RLS Coverage** - Some tables lack proper RLS policies
5. **Audit Logging** - Inconsistent audit trail implementation
6. **Performance** - Missing indexes on frequently queried columns

---

## 📊 Scope & Stories

This epic is broken down into **8 user stories** covering:

### **Core Schema Stories**
1. **[STORY-001](../stories/story-001-rooms-table.md)** - Rooms Table Stabilization
2. **[STORY-002](../stories/story-002-schedules-table.md)** - Schedules & Court Terms Table
3. **[STORY-003](../stories/story-003-capacities-table.md)** - Room Capacities & Occupancy
4. **[STORY-004](../stories/story-004-keys-table.md)** - Keys & Access Management Tables
5. **[STORY-005](../stories/story-005-tickets-table.md)** - Issues & Tickets System

### **Infrastructure Stories**
6. **[STORY-006](../stories/story-006-audit-log.md)** - Audit Log Framework
7. **[STORY-007](../stories/story-007-migrations.md)** - Migration Framework & Scripts
8. **[STORY-008](../stories/story-008-rls-policies.md)** - RLS Policies & Security

---

## 🏗️ Technical Architecture

### Database Design Principles
1. **Normalization** - 3NF for core tables, denormalization for performance where needed
2. **Referential Integrity** - All foreign keys with proper CASCADE/RESTRICT rules
3. **Audit Trail** - created_at, updated_at, created_by, updated_by on all tables
4. **Soft Deletes** - deleted_at column for recoverable deletions
5. **Versioning** - version column for optimistic locking where needed

### Naming Conventions
- **Tables:** `snake_case`, plural (e.g., `rooms`, `key_assignments`)
- **Columns:** `snake_case` (e.g., `room_number`, `created_at`)
- **Indexes:** `idx_<table>_<column>` (e.g., `idx_rooms_building_id`)
- **Foreign Keys:** `fk_<table>_<ref_table>` (e.g., `fk_rooms_buildings`)
- **Constraints:** `chk_<table>_<condition>` (e.g., `chk_rooms_capacity_positive`)

### Migration Strategy
```
db/migrations/
├── 001_core_schema.sql          # Core tables and enums
├── 002_spatial_hierarchy.sql    # Buildings, floors, rooms
├── 003_personnel.sql            # Profiles, occupants, roles
├── 004_keys_system.sql          # Keys, assignments, requests, orders
├── 005_issues_system.sql        # Issues, comments, history
├── 006_court_operations.sql     # Court terms, assignments, rooms
├── 007_audit_framework.sql      # Audit logs and triggers
├── 008_rls_policies.sql         # Row Level Security
├── 009_functions.sql            # Database functions
└── 010_views.sql                # Database views
```

---

## 📐 Final Database Schema

### **Core Schema Overview**

#### **Entity Relationship Diagram**
```
┌─────────────┐
│  buildings  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   floors    │
└──────┬──────┘
       │
       ▼
┌─────────────┐       ┌──────────────┐
│    rooms    │◄──────│  occupants   │
└──────┬──────┘       └──────┬───────┘
       │                     │
       ├─────────────────────┤
       │                     │
       ▼                     ▼
┌─────────────┐       ┌──────────────┐
│   issues    │       │     keys     │
└─────────────┘       └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐
                      │key_assignments│
                      └──────────────┘
```

### **1. Spatial Hierarchy Tables**

#### **buildings**
```sql
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
```

#### **floors**
```sql
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
  CONSTRAINT uq_floors_building_number UNIQUE (building_id, floor_number)
);
```

#### **rooms**
```sql
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
  CONSTRAINT uq_rooms_building_floor_number UNIQUE (building_id, floor_id, room_number)
);
```

### **2. Personnel & Access Tables**

#### **profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  phone TEXT,
  department TEXT,
  title TEXT,
  role user_role_enum DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_status verification_status_enum DEFAULT 'pending',
  enabled_modules TEXT[] DEFAULT ARRAY['spaces', 'issues', 'occupants'],
  preferences JSONB DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

#### **user_roles**
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);
```

#### **occupants**
```sql
CREATE TABLE occupants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email TEXT,
  phone TEXT,
  extension TEXT,
  department TEXT,
  title TEXT,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  employment_status employment_status_enum DEFAULT 'active',
  hire_date DATE,
  termination_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### **3. Keys & Access Management**

#### **keys**
```sql
CREATE TABLE keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_number TEXT NOT NULL UNIQUE,
  key_code TEXT,
  key_type key_type_enum NOT NULL DEFAULT 'physical',
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  floor_id UUID REFERENCES floors(id) ON DELETE SET NULL,
  access_level access_level_enum NOT NULL DEFAULT 'room',
  description TEXT,
  manufacturer TEXT,
  key_pattern TEXT,
  is_master_key BOOLEAN DEFAULT false,
  is_grand_master BOOLEAN DEFAULT false,
  total_quantity INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity >= 0),
  available_quantity INTEGER NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
  captain_office_copy BOOLEAN DEFAULT false,
  status key_status_enum NOT NULL DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_keys_quantity_valid CHECK (available_quantity <= total_quantity)
);
```

#### **key_assignments**
```sql
CREATE TABLE key_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES keys(id) ON DELETE RESTRICT,
  occupant_id UUID NOT NULL REFERENCES occupants(id) ON DELETE RESTRICT,
  assigned_by UUID REFERENCES profiles(id),
  assignment_type assignment_type_enum NOT NULL DEFAULT 'permanent',
  assignment_reason TEXT,
  expected_return_date DATE,
  status assignment_status_enum NOT NULL DEFAULT 'active',
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  returned_date DATE,
  is_active BOOLEAN DEFAULT true,
  key_condition condition_enum DEFAULT 'good',
  return_condition condition_enum,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_key_assignments_dates CHECK (returned_date IS NULL OR returned_date >= issued_date)
);
```

#### **key_requests**
```sql
CREATE TABLE key_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id),
  occupant_id UUID REFERENCES occupants(id),
  key_id UUID REFERENCES keys(id),
  room_id UUID REFERENCES rooms(id),
  request_type request_type_enum NOT NULL DEFAULT 'new',
  reason TEXT NOT NULL,
  urgency urgency_enum NOT NULL DEFAULT 'normal',
  status request_status_enum NOT NULL DEFAULT 'pending',
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approved_date DATE,
  fulfilled_date DATE,
  rejected_date DATE,
  approved_by UUID REFERENCES profiles(id),
  rejected_by UUID REFERENCES profiles(id),
  approval_notes TEXT,
  rejection_reason TEXT,
  fulfilled_by UUID REFERENCES profiles(id),
  assignment_id UUID REFERENCES key_assignments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_key_requests_key_or_room CHECK (key_id IS NOT NULL OR room_id IS NOT NULL)
);
```

### **4. Issues & Maintenance**

#### **issues**
```sql
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  building_id UUID REFERENCES buildings(id),
  floor_id UUID REFERENCES floors(id),
  room_id UUID REFERENCES rooms(id),
  location_description TEXT,
  category issue_category_enum NOT NULL,
  subcategory TEXT,
  issue_type issue_type_enum NOT NULL DEFAULT 'maintenance',
  priority priority_enum NOT NULL DEFAULT 'medium',
  severity severity_enum NOT NULL DEFAULT 'minor',
  status issue_status_enum NOT NULL DEFAULT 'open',
  resolution_type resolution_type_enum,
  resolution_notes TEXT,
  reported_by UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  assigned_team TEXT,
  reported_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_date TIMESTAMPTZ,
  started_date TIMESTAMPTZ,
  resolved_date TIMESTAMPTZ,
  closed_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  affects_operations BOOLEAN DEFAULT false,
  affects_safety BOOLEAN DEFAULT false,
  estimated_cost DECIMAL(10,2),
  attachments JSONB DEFAULT '[]'::jsonb,
  related_issues UUID[],
  work_order_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  CONSTRAINT chk_issues_dates CHECK (resolved_date IS NULL OR resolved_date >= reported_date)
);
```

### **5. Court Operations**

#### **court_terms**
```sql
CREATE TABLE court_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_name TEXT NOT NULL,
  term_code TEXT UNIQUE NOT NULL,
  term_year INTEGER NOT NULL CHECK (term_year >= 2020 AND term_year <= 2100),
  term_session TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status term_status_enum NOT NULL DEFAULT 'draft',
  is_active BOOLEAN DEFAULT false,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  CONSTRAINT chk_court_terms_dates CHECK (end_date >= start_date)
);
```

#### **court_assignments**
```sql
CREATE TABLE court_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  term_id UUID NOT NULL REFERENCES court_terms(id) ON DELETE CASCADE,
  justice_id UUID REFERENCES occupants(id),
  justice_name TEXT,
  clerk_ids UUID[],
  clerk_names TEXT[],
  sergeant_id UUID REFERENCES occupants(id),
  sergeant_name TEXT,
  assignment_type TEXT DEFAULT 'regular',
  priority INTEGER DEFAULT 0 CHECK (priority >= 0),
  sort_order INTEGER DEFAULT 0,
  status assignment_status_enum NOT NULL DEFAULT 'assigned',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  CONSTRAINT uq_court_assignments_room_term UNIQUE (court_room_id, term_id)
);
```

### **6. Audit & Logging**

#### **audit_logs**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation audit_operation_enum NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES profiles(id),
  user_email TEXT,
  user_role TEXT,
  ip_address INET,
  user_agent TEXT,
  action_description TEXT,
  action_category audit_category_enum,
  severity audit_severity_enum DEFAULT 'info',
  session_id TEXT,
  request_id TEXT,
  correlation_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM created_at)) STORED,
  month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM created_at)) STORED
) PARTITION BY RANGE (created_at);
```

### **Enums**

```sql
-- Room enums
CREATE TYPE room_type_enum AS ENUM ('office', 'courtroom', 'conference', 'storage', 'restroom', 'lobby', 'hallway', 'utility', 'mechanical', 'other');
CREATE TYPE room_status_enum AS ENUM ('available', 'occupied', 'reserved', 'maintenance', 'closed', 'under_construction');
CREATE TYPE operational_status_enum AS ENUM ('operational', 'non_operational', 'limited', 'temporary');

-- User enums
CREATE TYPE user_role_enum AS ENUM ('administrator', 'manager', 'staff', 'user', 'guest', 'supply_room_staff', 'court_operations', 'facilities_staff', 'security_admin');
CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE employment_status_enum AS ENUM ('active', 'inactive', 'terminated', 'on_leave', 'retired');

-- Key enums
CREATE TYPE key_type_enum AS ENUM ('physical', 'electronic', 'card', 'fob', 'code');
CREATE TYPE access_level_enum AS ENUM ('room', 'floor', 'building', 'master', 'grand_master');
CREATE TYPE key_status_enum AS ENUM ('active', 'inactive', 'lost', 'damaged', 'retired');
CREATE TYPE assignment_type_enum AS ENUM ('permanent', 'temporary', 'emergency', 'loaner');
CREATE TYPE assignment_status_enum AS ENUM ('active', 'returned', 'lost', 'overdue', 'cancelled');
CREATE TYPE condition_enum AS ENUM ('excellent', 'good', 'fair', 'poor', 'damaged', 'lost');
CREATE TYPE request_type_enum AS ENUM ('new', 'replacement', 'additional', 'temporary');
CREATE TYPE urgency_enum AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE request_status_enum AS ENUM ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled');

-- Issue enums
CREATE TYPE issue_category_enum AS ENUM ('maintenance', 'repair', 'cleaning', 'hvac', 'electrical', 'plumbing', 'security', 'safety', 'accessibility', 'other');
CREATE TYPE issue_type_enum AS ENUM ('maintenance', 'repair', 'inspection', 'complaint', 'request', 'emergency');
CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');
CREATE TYPE severity_enum AS ENUM ('minor', 'moderate', 'major', 'critical');
CREATE TYPE issue_status_enum AS ENUM ('open', 'acknowledged', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed', 'cancelled');
CREATE TYPE resolution_type_enum AS ENUM ('fixed', 'workaround', 'duplicate', 'cannot_reproduce', 'wont_fix', 'deferred', 'external');

-- Court enums
CREATE TYPE term_status_enum AS ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled', 'archived');

-- Audit enums
CREATE TYPE audit_operation_enum AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'TRUNCATE');
CREATE TYPE audit_category_enum AS ENUM ('authentication', 'authorization', 'data_change', 'configuration', 'security', 'access_control', 'system', 'user_action');
CREATE TYPE audit_severity_enum AS ENUM ('debug', 'info', 'notice', 'warning', 'error', 'critical');
```

### **Indexes Strategy**

```sql
-- Spatial hierarchy indexes
CREATE INDEX idx_floors_building ON floors(building_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_building ON rooms(building_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_floor ON rooms(floor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_type ON rooms(room_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_status ON rooms(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_search ON rooms USING gin(to_tsvector('english', coalesce(room_number, '') || ' ' || coalesce(room_name, '')));

-- Keys indexes
CREATE INDEX idx_keys_room ON keys(room_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_keys_building ON keys(building_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_keys_status ON keys(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_key_assignments_key ON key_assignments(key_id);
CREATE INDEX idx_key_assignments_occupant ON key_assignments(occupant_id);
CREATE INDEX idx_key_assignments_active ON key_assignments(is_active) WHERE is_active = true;
CREATE INDEX idx_key_requests_requester ON key_requests(requester_id);
CREATE INDEX idx_key_requests_status ON key_requests(status);

-- Issues indexes
CREATE INDEX idx_issues_room ON issues(room_id);
CREATE INDEX idx_issues_building ON issues(building_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX idx_issues_reported_by ON issues(reported_by);
CREATE INDEX idx_issues_search ON issues USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Court operations indexes
CREATE INDEX idx_court_terms_dates ON court_terms(start_date, end_date);
CREATE INDEX idx_court_terms_active ON court_terms(is_active) WHERE is_active = true;
CREATE INDEX idx_court_assignments_term ON court_assignments(term_id);
CREATE INDEX idx_court_assignments_room ON court_assignments(court_room_id);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('error', 'critical');
```

### **RLS Policies Summary**

All tables have RLS enabled with policies for:
- **Public Read:** Active records visible to all authenticated users
- **Admin Full Access:** Administrators can perform all operations
- **Owner Access:** Users can modify their own records
- **Role-Based Access:** Specific roles have specific permissions
- **Audit Protection:** Audit logs are read-only for non-admins

See `/db/migrations/008_rls_policies.sql` for complete policy definitions.

---

## 🔐 Security Requirements

### Row Level Security (RLS)
All tables must have RLS policies for:
- **SELECT** - Users see only their data or public data
- **INSERT** - Proper authorization checks
- **UPDATE** - Owner or admin only
- **DELETE** - Admin only (soft delete preferred)

### Audit Requirements
Critical tables require audit logging:
- `rooms` - Track all changes to room configuration
- `key_assignments` - Track key distribution
- `court_assignments` - Track court scheduling changes
- `issues` - Track issue lifecycle
- User actions on sensitive data

---

## 📈 Performance Considerations

### Indexing Strategy
1. **Primary Keys** - Clustered indexes on id columns
2. **Foreign Keys** - Indexes on all FK columns
3. **Query Patterns** - Indexes based on common WHERE clauses
4. **Composite Indexes** - For multi-column queries
5. **Partial Indexes** - For filtered queries (e.g., active records)

### Optimization Targets
- Query response time: < 100ms for simple queries
- Dashboard load time: < 500ms
- Report generation: < 2 seconds
- Concurrent users: Support 50+ simultaneous users

---

## 🧪 Testing Strategy

### Unit Tests
- Schema validation tests
- Constraint enforcement tests
- RLS policy tests
- Migration rollback tests

### Integration Tests
- Cross-table relationship tests
- Cascade delete tests
- Audit log generation tests
- Performance benchmarks

### Data Quality Tests
- Referential integrity checks
- Data type validation
- Constraint violation checks
- Duplicate detection

---

## 📅 Timeline & Milestones

### Week 1: Core Tables
- **Days 1-2:** Rooms table stabilization (STORY-001)
- **Days 3-4:** Schedules table (STORY-002)
- **Day 5:** Capacities table (STORY-003)

### Week 2: Access & Issues
- **Days 1-2:** Keys tables (STORY-004)
- **Days 3-4:** Tickets/Issues table (STORY-005)
- **Day 5:** Testing & validation

### Week 3: Infrastructure
- **Days 1-2:** Audit log framework (STORY-006)
- **Days 3-4:** Migration framework (STORY-007)
- **Day 5:** Documentation

### Week 4: Security & Polish
- **Days 1-3:** RLS policies (STORY-008)
- **Days 4-5:** Final testing, documentation, deployment

---

## 📊 Dependencies

### Upstream Dependencies
- Supabase project access
- Database admin credentials
- Existing data backup

### Downstream Dependencies
- Frontend components (minimal breaking changes)
- API endpoints (backward compatible)
- Reporting system (may need updates)

### Blockers
- None identified (existing schema is functional)

---

## 🎯 Acceptance Criteria

### Epic Complete When:
- [ ] All 8 stories completed and merged
- [ ] Schema documentation published
- [ ] ERD diagrams created and reviewed
- [ ] All migrations tested in staging
- [ ] RLS policies verified
- [ ] Performance benchmarks met
- [ ] Audit logging functional
- [ ] Seed scripts working
- [ ] Team training completed
- [ ] Production deployment successful

---

## 📚 Documentation Deliverables

1. **ERD Diagrams** - Visual schema representation
2. **Table Documentation** - Column definitions, constraints, relationships
3. **Migration Guide** - How to create and apply migrations
4. **RLS Policy Guide** - Security policy documentation
5. **Seed Data Guide** - Development data setup
6. **Performance Benchmarks** - Query performance baselines
7. **API Impact Analysis** - Breaking changes (if any)
8. **Rollback Procedures** - Emergency rollback steps

---

## 🚨 Risks & Mitigation

### Risk 1: Data Loss During Migration
- **Probability:** Low
- **Impact:** Critical
- **Mitigation:** 
  - Full database backup before migration
  - Test migrations in staging first
  - Rollback scripts prepared
  - Incremental migration approach

### Risk 2: Breaking Changes to Frontend
- **Probability:** Medium
- **Impact:** High
- **Mitigation:**
  - Backward compatibility maintained
  - Deprecation warnings for old patterns
  - Frontend team coordination
  - Staged rollout

### Risk 3: Performance Degradation
- **Probability:** Low
- **Impact:** Medium
- **Mitigation:**
  - Performance testing before deployment
  - Index optimization
  - Query plan analysis
  - Monitoring and alerts

### Risk 4: RLS Policy Gaps
- **Probability:** Medium
- **Impact:** Critical
- **Mitigation:**
  - Security review of all policies
  - Penetration testing
  - Audit log verification
  - Regular security audits

---

## 📞 Stakeholders

### Primary Stakeholders
- **Product Owner:** Court Operations Manager
- **Technical Lead:** Backend Team Lead
- **Database Admin:** DBA Team
- **Security Lead:** Security Team

### Secondary Stakeholders
- Frontend Development Team
- QA Team
- DevOps Team
- End Users (Court Staff)

---

## 🔄 Related Epics

- **EPIC-002:** UI Component Stabilization (depends on this)
- **EPIC-003:** Operations Workflow Enhancement (depends on this)
- **EPIC-004:** Reporting & Analytics (depends on this)

---

## 📝 Notes

### Technical Decisions
- Using Supabase migrations (not custom migration tool)
- PostgreSQL 15+ features available
- RLS preferred over application-level security
- Soft deletes for audit trail preservation
- UTC timestamps for all datetime fields

### Open Questions
- [ ] Retention policy for audit logs?
- [ ] Backup frequency and retention?
- [ ] Performance monitoring tools?
- [ ] Schema change approval process?

---

## 📊 Story Points Summary

| Story | Title | Points | Status |
|-------|-------|--------|--------|
| STORY-001 | Rooms Table | 5 | 📋 To Do |
| STORY-002 | Schedules Table | 5 | 📋 To Do |
| STORY-003 | Capacities Table | 3 | 📋 To Do |
| STORY-004 | Keys Tables | 8 | 📋 To Do |
| STORY-005 | Tickets Table | 5 | 📋 To Do |
| STORY-006 | Audit Log | 5 | 📋 To Do |
| STORY-007 | Migrations | 3 | 📋 To Do |
| STORY-008 | RLS Policies | 8 | 📋 To Do |
| **Total** | | **42** | |

---

## 🎉 Success Metrics

### Quantitative Metrics
- **Schema Stability:** 0 breaking changes after deployment
- **Query Performance:** 95% of queries < 100ms
- **RLS Coverage:** 100% of sensitive tables protected
- **Audit Coverage:** 100% of critical operations logged
- **Migration Success:** 100% successful in staging

### Qualitative Metrics
- Team confidence in schema stability
- Reduced time for new feature development
- Improved data integrity
- Enhanced security posture
- Better developer experience

---

**Epic Owner:** Backend Team Lead  
**Last Updated:** October 25, 2025  
**Next Review:** November 1, 2025
